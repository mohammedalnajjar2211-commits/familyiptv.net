// القائمة الجانبية

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleMenu() {

    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");

}

// إغلاق القائمة عند الضغط على الخلفية

overlay.addEventListener("click", () => {

    sidebar.classList.remove("active");
    overlay.classList.remove("active");

});

// البحث داخل المنتجات

const searchInput = document.getElementById("searchInput");

if(searchInput){

searchInput.addEventListener("keyup", function(){

let value = this.value.toLowerCase();

let cards = document.querySelectorAll(".card");

cards.forEach(card => {

let title =
card.querySelector("h3")
.textContent
.toLowerCase();

let desc =
card.querySelector("p")
.textContent
.toLowerCase();

if(
title.includes(value) ||
desc.includes(value)
){
card.style.display = "block";
}else{
card.style.display = "none";
}

});

});

}

// تأثير ظهور المنتجات

const cards = document.querySelectorAll(".card");

const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if(entry.isIntersecting){

entry.target.style.opacity = "1";
entry.target.style.transform = "translateY(0px)";

}

});

});

cards.forEach(card => {

card.style.opacity = "0";
card.style.transform = "translateY(30px)";
card.style.transition = ".6s";

observer.observe(card);

});

// PWA

if ("serviceWorker" in navigator) {

window.addEventListener("load", () => {

navigator.serviceWorker
.register("./service-worker.js")
.then(() => {

console.log("Service Worker Registered");

})
.catch(err => {

console.log(err);

});

});

}

// رسالة ترحيب بسيطة

console.log("Family Iraq Store Loaded");

// زر العودة للأعلى

const topBtn = document.createElement("button");

topBtn.innerHTML = "↑";

topBtn.style.position = "fixed";
topBtn.style.left = "20px";
topBtn.style.bottom = "20px";
topBtn.style.width = "45px";
topBtn.style.height = "45px";
topBtn.style.border = "none";
topBtn.style.borderRadius = "50%";
topBtn.style.background = "#d40000";
topBtn.style.color = "#fff";
topBtn.style.cursor = "pointer";
topBtn.style.display = "none";
topBtn.style.zIndex = "999";

document.body.appendChild(topBtn);

window.addEventListener("scroll", () => {

if(window.scrollY > 300){

topBtn.style.display = "block";

}else{

topBtn.style.display = "none";

}

});

topBtn.addEventListener("click", () => {

window.scrollTo({

top:0,
behavior:"smooth"

});

});