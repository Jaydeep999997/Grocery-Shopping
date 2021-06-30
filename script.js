const feedback = document.querySelector(".feedback");
const successAdd = document.querySelector("#success-add");
const successEdit = document.querySelector("#success-edit");
const successDelete = document.querySelector("#success-delete");
const nameFailure = document.querySelector("#item-name-failure");
const lowerRangeFailure = document.querySelector("#lower-range-failure");
const upperRangeFailure = document.querySelector("#upper-range-failure");
const positiveIntegerFailure = document.querySelector(
  "#positive-integer-failure"
);
const editFailure = document.querySelector("#edit-failure");

const formTitle = document.querySelector(".inputForm h2");
const form = document.querySelector("form");
const nameInput = document.querySelector(`[type="text"]`);
const quantityInput = document.querySelector(`[type="number"]`);
const formSubmit = document.querySelector("#submitList button");

const groceryList = document.querySelector(".groceryList");

const prefixID = "groceryItem";
const prefixRegex = new RegExp(prefixID);
const itemsInCart = new Map();
const EMPTY_MSG = "Empty Cart, Nothing to Show!";
const DELAY = 30000;

let clearStatusTO = "";
let statusQueue = [];
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
function addFeedback() {
  // appropriate messages
  for (let i = 0; i < statusQueue.length; i++) {
    statusQueue[i].style.display = "block";
  }

  // clear message queue
  statusQueue = [];

  // set timeout to remove pop ups
  clearStatusTO = setTimeout(removeFeedback, DELAY);
}

// remove feedback pop up messages
function removeFeedback() {
  // remove function call
  clearTimeout(clearStatusTO);

  // clear message queue
  statusQueue = [];

  // for all children, display: none
  for (let i = 0; i < feedback.children.length; i++) {
    feedback.children[i].style.display = "none";
  }
}

// check if item name is correct
// - atleast one char other than white space
function validateName(name) {
  name = name.trim();

  if (name.length === 0) {
    statusQueue.push(nameFailure);
    addFeedback();
    return false;
  }

  return true;
}

// check if item quantity is correct
// -  Integer between 1 to 100,000,000
function validateQuantity(quantity) {
  // remove leading zeros
  quantity = quantity.replace(/^0+/, "");

  // check if number is integer
  let nonZero = false;
  for (let i = quantity.length - 1; i >= 0; i--) {
    nonZero |= quantity[i] >= "1" && quantity[i] <= "9";
    if (quantity[i] === ".") {
      if (i === 0) {
        statusQueue.push(lowerRangeFailure);
        addFeedback();
        return false;
      }
      if (nonZero) {
        statusQueue.push(positiveIntegerFailure);
        addFeedback();
        return false;
      }
      quantity = quantity.substr(0, i);
      break;
    }
  }

  // checks for negative number
  for (let x in quantity) {
    if ((quantity[x] < "0" || quantity[x] > "9") && quantity[x] !== ".") {
      statusQueue.push(positiveIntegerFailure);
      addFeedback();
      return false;
    }
  }

  // checks for larger number
  if (quantity.length > 9) {
    statusQueue.push(upperRangeFailure);
    addFeedback();
    return false;
  }

  quantity = Number(quantity);

  // check if number satisfies range constraints
  if (quantity < 1) {
    statusQueue.push(lowerRangeFailure);
    addFeedback();
    return false;
  }

  if (quantity > 100000000) {
    statusQueue.push(upperRangeFailure);
    addFeedback();
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
      editFailure.innerText = `✘ Item with name "${itemName}" is already present in a Cart.`;
      statusQueue.push(editFailure);
      updateForm("", "", "Add Item", 0);
      addFeedback();
      return;
    }
    statusQueue.push(successEdit);
    Remove(currentEdit);
  } else {
    statusQueue.push(successAdd);
  }

  if (itemsInCart.has(itemName)) {
    itemQuan = Number(itemQuan) + Number(itemsInCart.get(itemName)["Quantity"]);
    Remove(itemName);
  }

  Add(itemName, itemQuan);

  updateForm("", "", "Add Item", 0);
  addFeedback();
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

  nameInput.focus();
}

// delete button
function deleteEventHandler(event) {
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

  statusQueue.push(successDelete);
  addFeedback();
}

// check if there are no items in a cart
checkEmpty();

// restore data from local storage
initialize();

form.addEventListener("submit", submitEventHandler);
