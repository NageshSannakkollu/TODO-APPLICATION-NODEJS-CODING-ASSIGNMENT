const express = require("express");
const app = express();
app.use(express.json());

const addDays = require("date-fns");
const format = require("date-fns/format");

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "todoApplication.db");
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At: http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error at: ${e.message}`);
  }
};

initializeDBAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasTodoSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const getUpdatedData = (eachData) => ({
  id: eachData.id,
  todo: eachData.todo,
  priority: eachData.priority,
  status: eachData.status,
  category: eachData.category,
  dueDate: eachData.due_date,
});

app.get("/todos/", async (request, response) => {
  const { status, priority, category, dueDate, search_q = "" } = request.query;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatus(request.body):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND status='${status}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND priority='${priority}';`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}';`;
      break;
    case hasCategory(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
      break;
    case hasTodoSearch(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await database.get(getTodosQuery);
  response.send(data.map((eachData) => getUpdatedData(eachData)));
});

//GET SPECIFIED TODO

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodo = `SELECT * FROM todo WHERE id=${todoId};`;
  const getTodoResponse = await database.get(getSpecificTodo);
  response.send(getTodoResponse);
});

//GET AGENDA WITH SPECIFIC DATE

const checkDueDate = (requestQuery) => {
  return requestQuery.date !== undefined;
};

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dueDateChecking = checkDueDate(request.query);
  // console.log(dueDateChecking);
  const formattedDate = format(new Date(date), "yyyy-MM-dd");
  console.log(formattedDate);
  if (dueDateChecking === true) {
    const getDueDateQuery = `SELECT * FROM todo WHERE due_date='${formattedDate}';`;
    const dateResponse = await database.get(getDueDateQuery);
    response.send(dateResponse);
  }
});

//create a new todo

app.post("/todos/", async (request, response) => {
  const todoItemDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoItemDetails;
  const createNewTodoQuery = `INSERT INTO todo VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  const createTodoResponse = await database.run(createNewTodoQuery);
  const todoId = createTodoResponse.lastID;
  response.send("Todo Successfully Added");
});

//UPDATE SPECIFIC TODO

const hasStatusProperty = (requestBody) => {
  return requestBody.status !== undefined;
};

const hasPriorityProperty = (requestBody) => {
  return requestBody.priority !== undefined;
};

const hasTodoProperty = (requestBody) => {
  return requestBody.todo !== undefined;
};

const hasCategoryProperty = (requestBody) => {
  return requestBody.category !== undefined;
};

const hasDueDateProperty = (requestBody) => {
  return requestBody.dueDate !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let getUpdateTodo = "";
  let data = "";
  switch (true) {
    case hasStatusProperty(request.body):
      getUpdateTodo = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      data = "Status";
      break;
    case hasPriorityProperty(request.body):
      getUpdateTodo = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      data = "Priority";
      break;
    case hasTodoProperty(request.body):
      getUpdateTodo = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      data = "Todo";
      break;
    case hasCategoryProperty(request.body):
      getUpdateTodo = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
      data = "Category";
      break;
    case hasDueDateProperty(request.body):
      getUpdateTodo = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId};`;
      data = "Due Date";
      break;
  }
  const updateResponse = await database.run(getUpdateTodo);
  response.send(`${data} Updated`);
});

//DELETE SPECIFIC TODO

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
