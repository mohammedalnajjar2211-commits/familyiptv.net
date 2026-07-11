// بيانات تسجيل الدخول

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Family@2025";

// عناصر الصفحة

const loginPage =
document.getElementById("loginPage");

const adminPanel =
document.getElementById("adminPanel");

const loginError =
document.getElementById("loginError");

// التحقق من الجلسة

if(localStorage.getItem("family_admin_logged") === "true"){

showAdminPanel();

}

// تسجيل الدخول

function login(){

const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;

if(
username === ADMIN_USERNAME &&
password === ADMIN_PASSWORD
){

localStorage.setItem(
"family_admin_logged",
"true"
);

showAdminPanel();

}else{

loginError.innerText =
"اسم المستخدم أو كلمة المرور غير صحيحة";

}

}

// تسجيل الخروج

function logout(){

localStorage.removeItem(
"family_admin_logged"
);

location.reload();

}

// إظهار لوحة الإدارة

function showAdminPanel(){

loginPage.style.display = "none";

adminPanel.classList.add("active");

renderProducts();

}

// جلب المنتجات

function getProducts(){

return JSON.parse(
localStorage.getItem("family_products")
) || [];

}

// حفظ المنتجات

function saveProducts(products){

localStorage.setItem(
"family_products",
JSON.stringify(products)
);

}

// إضافة منتج

function addProduct(){

const title =
document.getElementById("title").value;

const price =
document.getElementById("price").value;

const image =
document.getElementById("image").value;

const description =
document.getElementById("description").value;

if(
!title ||
!price ||
!image ||
!description
){

alert("يرجى تعبئة جميع الحقول");

return;

}

const products =
getProducts();

products.push({

id:Date.now(),

title:title,

price:price,

image:image,

description:description

});

saveProducts(products);

clearForm();

renderProducts();

alert("تمت إضافة المنتج");

}

// تفريغ النموذج

function clearForm(){

document.getElementById("title").value = "";

document.getElementById("price").value = "";

document.getElementById("image").value = "";

document.getElementById("description").value = "";

}

// عرض المنتجات

function renderProducts(){

const container =
document.getElementById("productsList");

if(!container) return;

const products =
getProducts();

if(products.length === 0){

container.innerHTML = `

<div style="
padding:25px;
background:#111;
border-radius:15px;
text-align:center;
">
لا توجد منتجات حالياً
</div>

`;

return;

}

container.innerHTML = "";

products.forEach(product => {

container.innerHTML += `

<div class="product-card">

<img src="${product.image}">

<div class="product-content">

<h4>${product.title}</h4>

<div class="product-price">
${product.price}
</div>

<div class="product-description">
${product.description}
</div>

<div class="actions">

<button
class="edit-btn"
onclick="editProduct(${product.id})"
>

تعديل

</button>

<button
class="delete-btn"
onclick="deleteProduct(${product.id})"
>

حذف

</button>

</div>

</div>

</div>

`;

});

}

// حذف منتج

function deleteProduct(id){

if(!confirm("هل تريد حذف المنتج؟"))
return;

let products =
getProducts();

products =
products.filter(
p => p.id !== id
);

saveProducts(products);

renderProducts();

}

// تعديل منتج

function editProduct(id){

const products =
getProducts();

const product =
products.find(
p => p.id === id
);

if(!product) return;

const title =
prompt(
"اسم المنتج",
product.title
);

if(title === null) return;

const price =
prompt(
"السعر",
product.price
);

if(price === null) return;

const image =
prompt(
"رابط الصورة",
product.image
);

if(image === null) return;

const description =
prompt(
"الوصف",
product.description
);

if(description === null) return;

product.title = title;
product.price = price;
product.image = image;
product.description = description;

saveProducts(products);

renderProducts();

alert("تم تحديث المنتج");

}

// تحميل أولي

document.addEventListener(
"DOMContentLoaded",
() => {

if(
localStorage.getItem(
"family_admin_logged"
) === "true"
){

renderProducts();

}

}
);