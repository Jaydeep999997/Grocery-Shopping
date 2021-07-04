const feedback = document.querySelector(".feedback");
const result = document.querySelector(".result");

const formTitle = document.querySelector(".inputForm h2");
const form = document.querySelector("#formContent");
const nameInput = document.querySelector(`#formContent [type="text"]`);
const quantityInput = document.querySelector(`#formContent [type="number"]`);
const formSubmit = document.querySelector("#submitList button");

const groceryList = document.querySelector(".groceryList");

const searchForm = document.querySelector(".skip-links form");
const searchInput = document.querySelector(`.skip-links [type="search"]`);
const searchSubmit = document.querySelector(`.skip-links button`);

const status = {
  addSuccess: "✔ Great! Item added successfully",
  editSuccess: "✔ Great! Item edited successfully",
  deleteSuccess: "✔ Great! Item deleted successfully",
  nameFailure: "✘ Name must contain atleast one character",
  editFailure: "✘ Item with given name already present in a cart",
  searchFailure: "✘ Item with given name is not present in a cart",
  emptyQuantityFailure: "✘ Quantity must contain atleast one number",
  lowerRangeFailure: "✘ Quantity must be greater than or equal to one",
  upperRangeFailure:
    "✘ Quantity must be less than or equal to one hundred million",
  integerFailure: "✘ Quantity must be an integer",
};

const prefixID = "groceryItem";
const prefixRegex = new RegExp(prefixID);
const itemsInCart = new Map();
const EMPTY_MSG = "Empty Cart, Nothing to Show!";
const DELAY = 20000;
const LOWER = 1;
const UPPER = 1000000000;

let clearStatusTO = "";
let currentEdit = "";
let currentItemID = 0;

// new button
function getButton(buttonName, controlID) {
  let newButton = document.createElement("button");
  newButton.setAttribute("type", "button");
  newButton.innerText = buttonName;
  buttonName = buttonName.toLowerCase();
  newButton.classList.add(buttonName);
  newButton.setAttribute("aria-describedby", controlID);
  newButton.setAttribute("aria-controls", controlID);
  buttonName === "edit"
    ? newButton.addEventListener("click", editEventHandler)
    : newButton.addEventListener("click", deleteEventHandler);
  return newButton;
}

// new paragraph
function getParagraph(idName, className, name) {
  let newParagraph = document.createElement("p");
  newParagraph.innerText = name;
  newParagraph.classList.add(className);
  newParagraph.setAttribute("id", idName);
  return newParagraph;
}

// display empty message, if the cart is empty
function checkEmpty() {
  if (itemsInCart.size === 0) {
    if (groceryList.children.length === 2) {
      groceryList.removeChild(groceryList.children[1]);
    }
    groceryList.appendChild(
      getParagraph("emptyPlace", "emptyPlace", EMPTY_MSG)
    );
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
  node.appendChild(getParagraph(`${itemID}-name`, "name", itemName));
  node.appendChild(
    getParagraph(`${itemID}-quantity`, "quan", `Quantity: ${itemQuan}`)
  );
  node.appendChild(getButton("Edit", `${itemID}-name`));
  node.appendChild(getButton("Delete", `${itemID}-name`));
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

// add feedback pop up messages
function addFeedback(key, toAdd, toRemove) {
  result.classList.remove(toRemove);
  result.classList.add(toAdd);

  toAdd === "success"
    ? result.setAttribute("aria-live", "polite")
    : result.setAttribute("aria-live", "assertive");

  // appropriate messages
  result.style.display = "block";
  result.innerHTML = status[key];

  // set timeout to remove pop ups
  clearStatusTO = setTimeout(removeFeedback, DELAY);
}

// remove feedback pop up messages
function removeFeedback() {
  // remove function call
  clearTimeout(clearStatusTO);

  // set display: none
  result.style.display = "none";
}

/*
 * check if item name is correct
 * - atleast one char other than white space
 */
function validateName(name) {
  if (name.trim().length === 0) {
    addFeedback("nameFailure", "failure", "success");
    return false;
  }

  return true;
}

/*
 * check if item quantity is correct
 * -  Integer between 1 to 100,000,000
 */
function validateQuantity(quantity) {
  // check if the quantity field is empty
  if (
    quantity.length === 0 ||
    (quantity.length === 1 && !(quantity[0] >= "0" && quantity[0] <= "9"))
  ) {
    addFeedback("emptyQuantityFailure", "failure", "success");
    return false;
  }

  quantity = Number(quantity);

  // quantity is smaller than 1
  if (quantity < LOWER) {
    addFeedback("lowerRangeFailure", "failure", "success");
    return false;
  }

  // quantity is larger than 10^9
  if (quantity > UPPER) {
    addFeedback("upperRangeFailure", "failure", "success");
    return false;
  }

  // quantity is not integer
  if (!Number.isInteger(quantity)) {
    addFeedback("integerFailure", "failure", "success");
    return false;
  }

  return true;
}

// verify name and quantity constraints and add appropriate messages in queue
function validateInput(itemName, itemQuan) {
  if (!validateName(itemName)) {
    nameInput.value = "";
    nameInput.focus();
    return false;
  }

  if (!validateQuantity(itemQuan)) {
    quantityInput.value = "";
    quantityInput.focus();
    return false;
  }

  return true;
}

// 'add item' button
function submitEventHandler(event) {
  event.preventDefault();

  // remove all callbacks and messages
  removeFeedback();

  let itemName = nameInput.value;
  let itemQuan = quantityInput.value;

  if (!validateInput(itemName, itemQuan)) {
    return;
  }

  itemName = itemName.trim();
  itemQuan = Number(itemQuan);

  if (formSubmit.innerText === "Edit Item") {
    // item with the same name already exists, in case of edit
    if (itemName !== currentEdit && itemsInCart.has(itemName)) {
      status.editFailure = `✘ Item with name <q>${itemName}</q> is already present in a Cart.`;
      updateForm("", "", "Add Item", 0);
      addFeedback("editFailure", "failure", "success");
      return;
    }
    addFeedback("editSuccess", "success", "failure");
    Remove(currentEdit);
  } else {
    addFeedback("addSuccess", "success", "failure");
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

  // remove all callbacks and messages
  removeFeedback();

  let parent = this.parentNode;
  let itemName = parent.children[0].innerText; // name
  currentEdit = parent.children[0].innerText; // name of item, which we are editing

  // update the form
  updateForm(
    itemName,
    Number(itemsInCart.get(itemName)["Quantity"]),
    "Edit Item",
    1
  );

  document.getElementById("formContent").scrollIntoView(true);
  nameInput.focus();
}

// delete button
function deleteEventHandler(event) {
  event.preventDefault();

  if (!confirm("Are you sure you want to delete this item?")) {
    return;
  }

  // remove all callbacks and messages
  removeFeedback();

  let parent = this.parentNode;
  let itemName = parent.querySelector("p").innerText;

  if (currentEdit === itemName) {
    updateForm("", "", "Add Item", 0);
  }

  Remove(itemName);

  addFeedback("deleteSuccess", "success", "failure");
}

// search item by name in a skip link
function searchEventHandler(event) {
  event.preventDefault();

  removeFeedback();

  const itemName = searchInput.value.trim();
  searchInput.value = "";

  // item name is not valid
  if (!validateName(itemName)) {
    searchInput.focus();
    return;
  }

  // item with given name is not present in a cart
  if (!itemsInCart.has(itemName)) {
    status.searchFailure = `✘ Item with name <q>${itemName}</q> is not present in a cart.`;
    addFeedback("searchFailure", "failure", "success");
    searchInput.focus();
    return;
  }

  document.querySelector(`#${itemsInCart.get(itemName)["ID"]} .edit`).focus();
  document
    .querySelector(`#${itemsInCart.get(itemName)["ID"]}`)
    .scrollIntoView(true);
}

// check if there are no items in a cart
checkEmpty();

// restore data from local storage
initialize();

searchForm.addEventListener("submit", searchEventHandler);
form.addEventListener("submit", submitEventHandler);
