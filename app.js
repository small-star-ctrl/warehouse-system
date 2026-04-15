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
            <td><a href="${item.link}" target="_blank" class="text-primary">${item.link || '点击查看'}</a></td>
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

// 修复后的保存逻辑：增加了友好提示
function saveData() {
    const skc = document.getElementById('skc').value.trim();
    const sku = document.getElementById('sku').value.trim();
    const name = document.getElementById('name').value.trim();
    
    // 基础必填项校验
    if (!skc || !sku || !name) {
        alert("SKC货号、SKU货号、中文名称为必填项！");
        return;
    }

    const id = document.getElementById('dataId').value;
    const imageUrl = document.getElementById('imageUrl').value.trim();
    
    // 优先级：URL > 本地上传
    if (imageUrl) {
        currentImage = imageUrl;
    }

    const formData = {
        skc: skc,
        sku: sku,
        name: name,
        link: document.getElementById('link').value, // 允许为空
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
        bootstrap.Modal.getInstance(document.getElementById('addModal')).hide();
        loadAllData();
        resetForm();
        alert("保存成功！");
    } catch (error) {
        console.error("保存失败：", error);
        alert("保存失败，请检查数据或联系管理员！");
    }
}

// ...以下省略其他函数（editData, deleteData等），保持原代码不变