const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dBPath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dBPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

isPriorityAndStatusPresent = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

isPriorityPresent = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

isStatusPresent = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;

  //   console.log(search_q);
  //   console.log(priority);
  //   console.log(status);

  let todoQuery = null;

  switch (true) {
    case isPriorityAndStatusPresent(request.query):
      todoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND (priority = '${priority}' AND status = '${status}');
        `;
      break;
    case isPriorityPresent(request.query):
      todoQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%' AND
                priority = '${priority}';
        `;
      break;
    case isStatusPresent(request.query):
      todoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%' AND
                status = '${status}';
        `;
      break;
    default:
      todoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%';
          `;
  }
  const getQuery = await db.all(todoQuery);
  return response.send(getQuery);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
        SELECT
            *
        FROM
            todo
        WHERE
            id = ${todoId};
    `;
  const todo = await db.get(getTodo);
  return response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodo = `
    INSERT INTO todo(
        id, todo, priority, status
    )
    VALUES(
        ${id}, '${todo}', '${priority}', '${status}'
    );
  `;
  const newTodo = await db.run(addTodo);
  return response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedStatus = null;

  switch (true) {
    case request.body.status !== undefined:
      updatedStatus = "Status";
      break;
    case request.body.priority !== undefined:
      updatedStatus = "Priority";
      break;
    case request.body.todo !== undefined:
      updatedStatus = "Todo";
      break;
  }

  //   console.log(updatedStatus);

  const getTodoOfTodoId = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = ${todoId};
  `;
  const todoOfTodoId = await db.get(getTodoOfTodoId);
  //   console.log(todoOfTodoId);

  const {
    status = todoOfTodoId.status,
    priority = todoOfTodoId.priority,
    todo = todoOfTodoId.todo,
  } = request.body;

  const updateQuery = `
    UPDATE todo
    SET
        todo = '${todo}',
        status = '${status}',
        priority = '${priority}'
    WHERE
        id = ${todoId};    
  `;

  await db.run(updateQuery);
  response.send(`${updatedStatus} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
        DELETE FROM todo
        WHERE
            id = ${todoId};
        `;
  await db.run(deleteTodo);
  return response.send("Todo Deleted");
});

module.exports = app;
