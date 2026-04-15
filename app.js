let dataList = [];
let currentImage = ""; // 存储Base64或URL

window.onload = function () {
    loadAllData();
    document.getElementById('checkAll').onchange = checkAll;
};

// 加载数据
function loadAllData() {
    const localData = localStorage.getItem('warehouseData');
    dataList = localData ? JSON.parse(localData) : [];
    renderTable(dataList);
}

// 渲染表格
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
            <td><a href="${item.link}" target="_blank" class="text-primary">点击查看</a></td>
            <td>${item.image ? `<img src="${item.image}" class="img-thumbnail">` : '无图片'}</td>
            <td>${item.remark || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary mb-1" onclick="editData('${item.id}')">编辑</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteData('${item.id}')">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 本地图片预览
function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        currentImage = ev.target.result;
        document.getElementById('imageUrl').value = ''; // 清空URL输入框
        const img = document.getElementById('previewImg');
        img.src = currentImage;
        img.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
}

// 保存（新增+编辑）
function saveData() {
    const id = document.getElementById('dataId').value;
    // 优先级：URL输入框 > 本地上传
    const imageUrl = document.getElementById('imageUrl').value.trim();
    if (imageUrl) {
        currentImage = imageUrl;
    }

    const formData = {
        skc: document.getElementById('skc').value,
        sku: document.getElementById('sku').value,
        name: document.getElementById('name').value,
        link: document.getElementById('link').value,
        image: currentImage,
        remark: document.getElementById('remark').value
    };

    if (id) {
        const index = dataList.findIndex(i => i.id === id);
        dataList[index] = { ...dataList[index], ...formData };
    } else {
        formData.id = Date.now().toString();
        dataList.unshift(formData);
    }

    localStorage.setItem('warehouseData', JSON.stringify(dataList));
    bootstrap.Modal.getInstance(document.getElementById('addModal')).hide();
    loadAllData();
    resetForm();
    alert("保存成功！");
}

// 编辑
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
    if (data.image && (data.image.startsWith('data:image') || data.image.startsWith('http'))) {
        img.src = data.image;
        img.classList.remove('d-none');
    } else {
        img.classList.add('d-none');
    }
    new bootstrap.Modal(document.getElementById('addModal')).show();
}

// 删除单条
function deleteData(id) {
    if (!confirm("确定删除该数据？")) return;
    dataList = dataList.filter(item => item.id !== id);
    localStorage.setItem('warehouseData', JSON.stringify(dataList));
    loadAllData();
}

// 搜索
function searchData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const result = dataList.filter(item =>
        item.skc.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword)
    );
    renderTable(result);
}

// 全选
function checkAll() {
    const status = document.getElementById('checkAll').checked;
    document.querySelectorAll('.item-check').forEach(cb => cb.checked = status);
}

// 批量删除
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

// 导出Excel
function exportExcel() {
    const exportData = dataList.map(item => ({
        'SKC货号': item.skc,
        'SKU货号': item.sku,
        '中文名称': item.name,
        '进货链接': item.link,
        '商品图片': item.image, // 导出图片URL
        '备注': item.remark
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "仓库数据");
    XLSX.writeFile(wb, "仓库数据查询系统.xlsx");
}

// 批量导入Excel（支持图片URL）
function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        json.forEach(row => {
            // 必须字段校验
            if (row['SKC货号'] && row['SKU货号'] && row['中文名称']) {
                dataList.unshift({
                    id: Date.now() + Math.random().toString(36),
                    skc: row['SKC货号'] || "",
                    sku: row['SKU货号'] || "",
                    name: row['中文名称'] || "",
                    link: row['进货链接'] || "",
                    image: row['商品图片'] || "", // 读取图片URL列
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

// 重置表单
function resetForm() {
    document.getElementById('dataForm').reset();
    document.getElementById('dataId').value = "";
    currentImage = "";
    document.getElementById('previewImg').classList.add('d-none');
}