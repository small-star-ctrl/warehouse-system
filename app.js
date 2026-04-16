let dataList = [];
let currentImage = "";

window.onload = function () {
    loadAllData();
    document.getElementById('checkAll').onchange = checkAll;
};

function loadAllData() {
    const localData = localStorage.getItem('warehouseData');
    dataList = localData ? JSON.parse(localData) : [];
    renderTable(dataList);
}

function renderTable(list) {
    const tbody = document.getElementById('dataTable');
    tbody.innerHTML = "";
    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="item-check" value="${item.id}"></td>
            <td>${item.skc}</td>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td><a href="${item.link}" target="_blank" class="text-primary">${item.link || '链接'}</a></td>
            <td>${item.image ? `<img src="${item.image}" class="img-thumbnail">` : '无图片'}</td>
            <td>${item.remark || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary mb-1" onclick="editData('${item.id}')">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteData('${item.id}')">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        currentImage = ev.target.result;
        document.getElementById('imageUrl').value = '';
        const img = document.getElementById('previewImg');
        img.src = currentImage;
        img.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
}

function saveData() {
    const skc = document.getElementById('skc').value.trim();
    const sku = document.getElementById('sku').value.trim();
    const name = document.getElementById('name').value.trim();

    if (!skc || !sku || !name) {
        alert("SKC货号、SKU货号、中文名称为必填项！");
        return;
    }

    const id = document.getElementById('dataId').value;
    const imageUrlInput = document.getElementById('imageUrl');
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

    if (imageUrl) {
        currentImage = imageUrl;
    }

    const formData = {
        skc: skc,
        sku: sku,
        name: name,
        link: document.getElementById('link').value,
        image: currentImage,
        remark: document.getElementById('remark').value
    };

    try {
        if (id) {
            const index = dataList.findIndex(i => i.id === id);
            dataList[index] = { ...dataList[index], ...formData };
        } else {
            formData.id = Date.now().toString();
            dataList.unshift(formData);
        }

        localStorage.setItem('warehouseData', JSON.stringify(dataList));

        // 稳定可靠的模态框关闭方式
        const modalElement = document.getElementById('addModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        } else {
            modalElement.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }

        loadAllData();
        resetForm();
        alert("保存成功！");
    } catch (error) {
        console.error("保存失败：", error);
        alert("保存失败，请检查数据或联系管理员！");
    }
}

function editData(id) {
    const data = dataList.find(item => item.id === id);
    document.getElementById('dataId').value = data.id;
    document.getElementById('skc').value = data.skc;
    document.getElementById('sku').value = data.sku;
    document.getElementById('name').value = data.name;
    document.getElementById('link').value = data.link;
    document.getElementById('remark').value = data.remark;
    document.getElementById('imageUrl').value = data.image || '';
    currentImage = data.image || '';

    const img = document.getElementById('previewImg');
    if (data.image) {
        img.src = data.image;
        img.classList.remove('d-none');
    } else {
        img.classList.add('d-none');
    }

    new bootstrap.Modal(document.getElementById('addModal')).show();
}

function deleteData(id) {
    if (!confirm("确定删除该数据？")) return;
    dataList = dataList.filter(item => item.id !== id);
    localStorage.setItem('warehouseData', JSON.stringify(dataList));
    loadAllData();
}

function searchData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const result = dataList.filter(item =>
        item.skc.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword)
    );
    renderTable(result);
}

function checkAll() {
    const status = document.getElementById('checkAll').checked;
    document.querySelectorAll('.item-check').forEach(cb => cb.checked = status);
}

function batchDelete() {
    const checks = document.querySelectorAll('.item-check:checked');
    if (checks.length === 0) {
        alert("请选择要删除的数据！");
        return;
    }
    if (!confirm(`确定删除选中的 ${checks.length} 条数据？`)) return;

    const ids = Array.from(checks).map(cb => cb.value);
    dataList = dataList.filter(item => !ids.includes(item.id));
    localStorage.setItem('warehouseData', JSON.stringify(dataList));
    loadAllData();
}

function exportExcel() {
    const exportData = dataList.map(item => ({
        'SKC货号': item.skc,
        'SKU货号': item.sku,
        '中文名称': item.name,
        '进货链接': item.link,
        '商品图片': item.image,
        '备注': item.remark
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "仓库数据");
    XLSX.writeFile(wb, "仓库数据.xlsx");
}

function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        json.forEach(row => {
            if (row['SKC货号'] && row['SKU货号'] && row['中文名称']) {
                dataList.unshift({
                    id: Date.now() + Math.random().toString(36),
                    skc: row['SKC货号'] || "",
                    sku: row['SKU货号'] || "",
                    name: row['中文名称'] || "",
                    link: row['进货链接'] || "",
                    image: row['商品图片'] || "",
                    remark: row['备注'] || ""
                });
            }
        });
        localStorage.setItem('warehouseData', JSON.stringify(dataList));
        loadAllData();
        alert(`导入完成！共 ${json.length} 条数据`);
        document.getElementById('importFile').value = "";
    };
    reader.readAsArrayBuffer(file);
}
function resetForm() {
    document.getElementById('dataForm').reset();
    document.getElementById('dataId').value = "";
    currentImage = "";
    document.getElementById('previewImg').classList.add('d-none');
    
    // 👇 关键：加上容错判断，防止元素不存在时报错
    const imageUrlEl = document.getElementById('imageUrl');
    if (imageUrlEl) {
        imageUrlEl.value = "";
    }
}

/*function resetForm() {
    document.getElementById('dataId').value = "";
    document.getElementById('skc').value = "";
    document.getElementById('sku').value = "";
    document.getElementById('name').value = "";
    document.getElementById('link').value = "";
    document.getElementById('imageUrl').value = "";
    document.getElementById('remark').value = "";
    currentImage = "";
    document.getElementById('previewImg').classList.add('d-none');
}*/
