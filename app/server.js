const http = require("http");
const finalHandler = require("finalhandler");
const queryString = require("querystring");
const url = require("url");
const Router = require("router");
const bodyParser = require("body-parser");
const fs = require("fs");
// State holding variables
let goals = [];
let user = {};
let users = [];
let categories = [];

// Setup router
let myRouter = Router();
myRouter.use(bodyParser.json());

// This function is a bit simpler...
http
  .createServer((request, response) => {
    myRouter(request, response, finalHandler(request, response));
  })
  .listen(3002, () => {
    // Load dummy data into server memory for serving
    goals = JSON.parse(fs.readFileSync("goals.json", "utf-8"));

    // Load all users into users array and for now hardcode the first user to be "logged in"
    users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
    user = users[0];

    // Load all categories from file
    categories = JSON.parse(fs.readFileSync("categories.json", "utf-8"));
  });

// Notice how much cleaner these endpoint handlers are...
myRouter.get("/v1/goals", (request, response) => {
  // Get our query params from the query string
  const queryParams = queryString.parse(url.parse(request.url).query);

  try {
    let filtGoals = goals;

    if (queryParams.category) {
      const categoryName = queryParams.category.toLowerCase();
      const category = categories.find(
        (c) => c.name.toLowerCase() === categoryName
      );

      if (!category) {
        return response
          .writeHead(400, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              code: 400,
              message: "Invalid category specified",
              fields: "category",
            })
          );
      }

      filtGoals = goals.filter((goal) => goal.categoryId === category.id);
    }

    return response.end(JSON.stringify(filtGoals));
  } catch (err) {
    console.error("Error processing request:", err);
    response.writeHead(500, { "Content-Type": "application/json" });
    return response.end(
      JSON.stringify({
        code: 500,
        message: "Internal server error",
        fields: "unknown",
      })
    );
  }
});

myRouter.get("/v1/me", (request, response) => {
  try {
    return response.end(JSON.stringify(user));
  } catch (err) {
    console.error("Error processing request:", err);
    return response.end(
      JSON.stringify({
        code: 500,
        message: "Internal server error",
        fields: "user",
      })
    );
  }
});

// See how i'm not having to build up the raw data in the body... body parser just gives me the whole thing as an object.
// See how the router automatically handled the path value and extracted the value for me to use?  How nice!
myRouter.post("/v1/me/goals/:goalId/accept", function (request, response) {
  // Find goal from id in url in list of goals
  try {
    let goal = goals.find((goal) => goal.id == request.params.goalId);
    // Add it to our logged in user's accepted goals

    if (!goal) {
      return response
        .writeHead(400, { "Content-Type": "application/json" })
        .end(
          JSON.stringify({
            code: 400,
            message: "Invalid goal specified",
            fields: "goal",
          })
        );
    }

    user.acceptedGoals.push(goal);
    // No response needed other than a 200 success
    return response.writeHead(200).end();
  } catch (err) {
    console.error("Error processing this request:", err);
    return response.end(
      JSON.stringify({
        code: 500,
        message: "Internal server error",
        fields: "unknown",
      })
    );
  }
});

myRouter.post("/v1/me/goals/:goalId/achieve", function (request, response) {
  // Find goal from id in url in list of goals
  try {
    let goal = goals.find((goal) => goal.id == request.params.goalId);
    // Add it to our logged in user's accepted goals

    if (!goal) {
      return response
        .writeHead(400, { "Content-Type": "application/json" })
        .end(
          JSON.stringify({
            code: 400,
            message: "Invalid goal specified",
            fields: "goal",
          })
        );
    }

    user.achievedGoals.push(goal);
    // No response needed other than a 200 success
    return response.writeHead(200).end();
  } catch (err) {
    console.error("Error processing this request:", err);
    return response.end(
      JSON.stringify({
        code: 500,
        message: "Internal server error",
        fields: "unknown",
      })
    );
  }
});

myRouter.post(
  "/v1/me/goals/:goalId/challenge/:userId",
  function (request, response) {
    // Find goal from id in url in list of goals
    let goal = goals.find((goal) => {
      return goal.id == request.params.goalId;
    });
    // Find the user who is being challenged in our list of users
    let challengedUser = users.find((user) => {
      return user.id == request.params.userId;
    });
    // Make sure the data being changed is valid
    if (!goal) {
      response.statusCode = 400;
      return response.end("No goal with that ID found.");
    }
    // Add the goal to the challenged user
    challengedUser.challengedGoals.push(goal);
    // No response needed other than a 200 success
    return response.end();
  }
);
