const form = document.querySelector("form");
const formTitle = document.querySelector(".inputForm h2");
const nameInput = document.querySelector(`[type="text"]`);
const quantityInput = document.querySelector(`[type="number"]`);
const formSubmit = document.querySelector("#submitList button");
const groceryList = document.querySelector(".groceryList");
const prefixID = "groceryItem";
const prefixRegex = new RegExp(prefixID);
const itemsInCart = new Map();
const EMPTY_MSG = "Empty Cart, Nothing to Show!";

let currentEdit = "";
let currentItemID = 0;

// new button
function getButton(buttonName) {
  let newButton = document.createElement("button");
  newButton.setAttribute("type", "button");
  newButton.innerText = buttonName;
  buttonName = buttonName.toLowerCase();
  newButton.classList.add(buttonName);
  buttonName === "edit"
    ? newButton.addEventListener("click", editEventHandler)
    : newButton.addEventListener("click", deleteEventHandler);
  return newButton;
}

// new paragraph
function getParagraph(className, itemName) {
  let newParagraph = document.createElement("p");
  newParagraph.innerText = itemName;
  newParagraph.classList.add(className);
  return newParagraph;
}

// display empty message, if the cart is empty
function checkEmpty() {
  if (itemsInCart.size === 0) {
    if (groceryList.children.length === 2) {
      groceryList.removeChild(groceryList.children[1]);
    }
    groceryList.appendChild(getParagraph("emptyPlace", EMPTY_MSG));
  }
}

// remove an item with given item name
function Remove(itemName) {
  let itemID = itemsInCart.get(itemName)["ID"];
  const listLocation = document.querySelector(".groceryList ul");

  // remove from DOM
  let location = listLocation.querySelector(`#${itemID}`);
  listLocation.removeChild(location);

  // remove from localStorage
  localStorage.removeItem(itemID);

  // remove from Map
  itemsInCart.delete(itemName);

  // If cart is empty, display appropriate message
  checkEmpty();
}

// add an item with given name and quantity
function Add(itemName, itemQuan) {
  let itemID = `${prefixID}${currentItemID}`;

  // if we are initializing list, remove empty message
  if (itemsInCart.size === 0) {
    groceryList.removeChild(groceryList.children[1]); // Remove Empty Message
    let nodeUL = document.createElement("ul");
    groceryList.appendChild(nodeUL);
  }

  // add in DOM
  const listLocation = document.querySelector(".groceryList ul");
  let node = document.createElement("li");
  node.setAttribute("id", itemID);
  node.appendChild(getParagraph("name", itemName));
  node.appendChild(getParagraph("quan", `Quantity: ${itemQuan}`));
  node.appendChild(getButton("Edit"));
  node.appendChild(getButton("Delete"));
  listLocation.prepend(node);

  // Add in localStorage
  localStorage.setItem(
    itemID,
    JSON.stringify({
      Name: itemName,
      Quantity: itemQuan,
    })
  );

  // Add in Map
  itemsInCart.set(itemName, {
    Quantity: itemQuan,
    ID: itemID,
  });

  ++currentItemID; // Increment the global ID variable
}

// Change the main form to display edit / add
function updateForm(itemName, itemQuan, buttonTitle, editMode) {
  nameInput.value = itemName;
  quantityInput.value = itemQuan;
  formSubmit.innerText = buttonTitle;

  if (editMode) {
    form.classList.add("highlight");
    formTitle.innerText = "Edit Grocery Item";
  } else if (form.classList.contains("highlight")) {
    form.classList.remove("highlight");
    formTitle.innerText = "Add Grocery Item";
  }
}

// initialize cart by fetching items from localStorage
function initialize() {
  let toBeAdded = [];
  for (let i = 0; i < localStorage.length; i++) {
    let currentID = localStorage.key(i);
    if (prefixRegex.test(currentID)) {
      let itemObject = JSON.parse(localStorage.getItem(currentID));
      toBeAdded.push([currentID, itemObject["Name"], itemObject["Quantity"]]);
    }
  }

  for (let idx in toBeAdded) {
    localStorage.removeItem(toBeAdded[idx][0]);
  }

  for (let idx in toBeAdded) {
    Add(toBeAdded[idx][1], toBeAdded[idx][2]);
  }
}

// 'add item' button
function submitEventHandler(event) {
  event.preventDefault();

  let itemName = nameInput.value;
  itemName = itemName.trim();
  if (itemName.length === 0) {
    updateForm("", "", "Add Item", 0);
    alert("Item name must contain atleast one chacter!");
    return;
  }

  let itemQuan = Number(quantityInput.value);
  if (formSubmit.innerText === "Edit Item") {
    if (itemName !== currentEdit && itemsInCart.has(itemName)) {
      alert(`Item with name ${itemName} is already present in a Cart.`);
      updateForm("", "", "Add Item", 0);
      return;
    }
    Remove(currentEdit);
  }

  if (itemsInCart.has(itemName)) {
    itemQuan = Number(itemQuan) + Number(itemsInCart.get(itemName)["Quantity"]);
    Remove(itemName);
  }

  Add(itemName, itemQuan);

  updateForm("", "", "Add Item", 0);
}

// edit button
function editEventHandler(event) {
  event.preventDefault();

  let parent = this.parentNode;
  let itemName = parent.children[0].innerText; // name
  let itemQuan = parent.children[1].innerText; // quantity
  currentEdit = parent.children[0].innerText; // name of item, which we are editing

  // update the form
  updateForm(
    itemName,
    itemQuan.substr(10, itemQuan.length - 10),
    "Edit Item",
    1
  );
}

// delete button
function deleteEventHandler(event) {
  if (!confirm("Are you sure you want to delete this item?")) {
    return;
  }

  let parent = this.parentNode;
  let itemName = parent.querySelector("p").innerText;

  if (currentEdit === itemName) {
    updateForm("", "", "Add Item", 0);
  }

  Remove(itemName);
}

checkEmpty();

initialize();

form.addEventListener("submit", submitEventHandler);
