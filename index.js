const hamburgerElement = document.getElementById("hamburger");
const menuElement = document.getElementById("menu");
hamburgerElement.addEventListener("click", () => menuElement.classList
		.contains("visible") 
		? menuElement.classList.remove("visible") 
		: menuElement.classList.add("visible"));