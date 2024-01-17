const express = require("express");
const app = express();
app.use(express.json());
const addDays = require("date-fns");
const format = require("date-fns/format");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
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

const hasTodoDueDate = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { status, priority, category, dueDate, search_q = "" } = request.query;

  let getTodosQuery = "";
  let todosStatus = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      todosStatus = "Todo Priority and Status";
      getTodosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}';`;
      break;
    case hasCategoryAndStatus(request.query):
      todosStatus = "Todo Category and Status";
      getTodosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND status='${status}';`;
      break;
    case hasCategoryAndPriority(request.query):
      todosStatus = "Todo Category and Priority";
      getTodosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND priority='${priority}';`;
      break;
    case hasStatus(request.query):
      todosStatus = "Todo Status";
      getTodosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`;
      break;
    case hasPriority(request.query):
      todosStatus = "Todo Priority";
      getTodosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}';`;
      break;
    case hasCategory(request.query):
      todosStatus = "Todo Category";
      getTodosQuery = `
        SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
      break;
    case hasTodoSearch(request.query):
      //console.log(request.query);
      getTodosQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case hasTodoDueDate(request.query):
      todosStatus = "Due Date";
      getTodosQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE due_date='${dueDate}';`;
  }
  data = await database.all(getTodosQuery);
  console.log(data.length);

  if (data.length === 0) {
    response.status(400);
    response.send(`Invalid ${todosStatus}`);
  } else {
    response.send(data);
  }
});

//GET SPECIFIED TODO

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodo = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE id=${todoId};`;
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
  console.log(typeof formattedDate);
  if (dueDateChecking === true) {
    const getDueDateQuery = `SELECT * FROM todo WHERE due_date LIKE '${formattedDate}';`;
    const dateResponse = await database.get(getDueDateQuery);
    console.log(dateResponse);
    if (dateResponse === undefined) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      response.send(dateResponse);
    }
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let createTodoColumn = null;
  console.log(dueDate);
  switch (true) {
    case status === undefined:
      createTodoColumn = "Todo Status";
      break;
    case priority === undefined:
      createTodoColumn = "Todo Priority";
      break;
    case category === undefined:
      createTodoColumn = "Todo Category";
      break;
    case dueDate === undefined:
      createTodoColumn = "Due Date";
      break;
  }

  if (createTodoColumn === null) {
    const updateTodoQuery = `
    INSERT INTO 
    todo (id,todo,priority,status,category,due_date)
    VALUES (
    ${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    await database.run(updateTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(`Invalid ${createTodoColumn}`);
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const requestBody = request.body;
  let updatedRequestColumn = null;

  switch (true) {
    case requestBody.status !== undefined:
      updatedRequestColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedRequestColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      updatedRequestColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updatedRequestColumn = "Due Date";
      break;
    case requestBody.todo !== undefined:
      updatedRequestColumn = "Todo";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  console.log(previousTodo);
  const { todo, status, priority, category, dueDate } = previousTodo;
  const updatedTodoQuery = `
  UPDATE 
  todo 
  SET 
      todo='${todo}',
      status='${status}',
      priority='${priority}',
      category='${category}',
      due_date='${dueDate}' 
      WHERE 
      id=${todoId};`;
  await database.run(updatedTodoQuery);
  response.send(`${updatedRequestColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id=${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
