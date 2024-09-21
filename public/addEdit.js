import { enableInput, inputEnabled, message, setDiv, token } from "./index.js";
import { showTasks } from "./tasks.js";

let addEditDiv = null;
let title = null;
let description = null;
let isUrgent = null;
let dueDate = null;
let tags = null;
let status = null;
let addingTask = null;
let subTasksDiv = null;
let subTasksCounter = 1;

export const handleAddEdit = () => {
   addEditDiv = document.getElementById("edit-task");
   title = document.getElementById("title");
   description = document.getElementById("description");
   isUrgent = document.getElementById("isUrgent");
   dueDate = document.getElementById("dueDate");
   tags = document.getElementById("tags");
   status = document.getElementById("status");
   addingTask = document.getElementById("adding-task");
   const editCancel = document.getElementById("edit-cancel");
   const newSubTask = document.getElementById("new-sub-task");
   const deleteSubTask = document.getElementById("delete-last-sub-task");
   subTasksDiv = document.getElementById("sub-tasks");

   addEditDiv.addEventListener("click", async (e) => {
      if (inputEnabled && e.target.nodeName === "BUTTON") {
         if (e.target === addingTask) {
            enableInput(false);
            let method = "POST";
            let url = "/api/v1/tasks";
            const subTasks = makeSubTasksObj();
            let isUrgentBoolean = false;

            isUrgent.value === "true"
               ? (isUrgentBoolean = true)
               : (isUrgentBoolean = false);

            let fetchObj = {
               method: method,
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
               },
               body: JSON.stringify({
                  title: title.value,
                  description: description.value,
                  isUrgent: isUrgentBoolean,
                  dueDate: dueDate.value,
                  tags: tags.value,
                  subTasks: subTasks,
                  status: status.value,
                  createAt: Date.now(),
                  updateAt: Date.now(),
               }),
            };

            if (addingTask.textContent === "update") {
               method = "PATCH";
               url = `/api/v1/tasks/${addEditDiv.dataset.id}`;

               fetchObj.method = method;
               fetchObj.body = JSON.stringify({
                  ...JSON.parse(fetchObj.body || "{}"),
                  title: title.value,
                  description: description.value,
                  isUrgent: isUrgentBoolean,
                  dueDate: dueDate.value,
                  tags: tags.value,
                  subTasks: subTasks,
                  status: status.value,
                  updateAt: Date.now(),
               });
            }

            try {
               const response = await fetch(url, fetchObj);

               const data = await response.json();
               if (response.status === 200 || response.status === 201) {
                  if (response.status === 200) {
                     // a 200 is expected for a successful update
                     message.textContent = "The task entry was updated.";
                  } else {
                     // a 201 is expected for a successful create
                     message.textContent = "The task entry was created.";
                  }
                  resetFormValues();
                  showTasks();
               } else {
                  message.textContent = data.msg;
               }
            } catch (err) {
               console.log(err);
               message.textContent = "A communication error occurred.";
            }
            enableInput(true);
         } else if (e.target === editCancel) {
            message.textContent = "";
            showTasks();
         } else if (e.target === newSubTask) {
            addNewSubTask();
            deleteSubTask.style.display = "inline";
         } else if (e.target === deleteSubTask) {
            deleteLastSubTask();
            if (!subTasksDiv.lastElementChild) {
               deleteSubTask.style.display = "none";
            }
         }
      }
   });
};

const resetFormValues = () => {
   title.value = "";
   description.value = "";
   isUrgent.value = "false";
   dueDate.value = "";
   tags.value = "";
   resetSubTasks();
   status.value = "pending";
};
const addNewSubTask = () => {
   subTasksCounter = subTasksCounter + 1;

   const newSubTaskDiv = document.createElement("div");
   const label = document.createElement("label");
   const input = document.createElement("input");

   newSubTaskDiv.id = `div-sub-task-${subTasksCounter}`;
   newSubTaskDiv.style.display = "block";

   label.setAttribute("for", `sub-task-${subTasksCounter}`);
   label.textContent = `${subTasksCounter}. `;

   input.type = "text";
   input.id = `sub-task-${subTasksCounter}`;

   newSubTaskDiv.appendChild(label);
   newSubTaskDiv.appendChild(input);
   subTasksDiv.appendChild(newSubTaskDiv);
   return newSubTaskDiv;
};

const deleteLastSubTask = () => {
   subTasksDiv.removeChild(subTasksDiv.lastElementChild);
   subTasksCounter = subTasksCounter - 1;
};

const resetSubTasks = (keepOneInput = true) => {
   const childElementCount = subTasksDiv.childElementCount;
   for (let index = keepOneInput ? 1 : 0; index < childElementCount; index++) {
      deleteLastSubTask();
   }
   if (keepOneInput) {
      const initialsubTask = document.getElementById("sub-task-1");
      initialsubTask.value = "";
   }
};

const makeSubTasksObj = () => {
   let subTasksObj = [];
   const inputs = subTasksDiv.getElementsByTagName("input");

   for (let index = 0; index < inputs.length; index++) {
      if (inputs[index].value != "") {
         subTasksObj.push({
            title: inputs[index].value,
         });
      }
   }

   return subTasksObj;
};

const prepareSubTasksEdit = (subTasks) => {
   resetSubTasks(false);

   for (let index = 0; index < subTasks.length; index++) {
      let newSubTaskDiv = addNewSubTask();
      newSubTaskDiv.getElementsByTagName("input")[0].value =
         subTasks[index].title;
   }
};

export const showAddEdit = async (taskId) => {
   if (!taskId) {
      resetFormValues();
      addingTask.textContent = "add";
      message.textContent = "";

      setDiv(addEditDiv);
   } else {
      enableInput(false);

      try {
         const response = await fetch(`/api/v1/tasks/${taskId}`, {
            method: "GET",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
            },
         });

         const data = await response.json();
         if (response.status === 200) {
            prepareSubTasksEdit(data.task.subTasks);

            title.value = data.task.title;
            description.value = data.task.description;
            isUrgent.value = data.task.isUrgent;
            dueDate.value = data.task.dueDate;
            tags.value = data.task.tags;
            status.value = data.task.status;
            addingTask.textContent = "update";
            message.textContent = "";
            addEditDiv.dataset.id = taskId;

            setDiv(addEditDiv);
         } else {
            // might happen if the list has been updated since last display
            message.textContent = "The tasks entry was not found";
            showTasks();
         }
      } catch (err) {
         console.log(err);
         message.textContent = "A communications error has occurred.";
         showTasks();
      }

      enableInput(true);
   }
};

export const showDelete = async (taskId) => {
   enableInput(false);
   try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
         method: "DELETE",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
         },
      });

      const data = await response.json();
      if (response.status === 200) {
         message.textContent = data.msg;
         showTasks();
      } else if (response.status === 404) {
         message.textContent = "The tasks entry was not found";
         showTasks();
      } else {
         throw new Error(`Unexpected error status code: ${response.status}`);
      }
   } catch (err) {
      console.log(err);
      message.textContent = "A communications error has occurred.";
      showTasks();
   }
   enableInput(true);
};
