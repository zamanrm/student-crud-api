# Student CRUD API

A beginner-friendly backend built with **Node.js**, **Express**, and
**MongoDB**. It stores student records in the `studentDB` database and
`students` collection.

## What you need

- Node.js 20 or newer, which includes npm
- MongoDB Community Server installed and running on your computer
- Postman to try the API (optional)

> The default MongoDB address, `mongodb://127.0.0.1:27017/studentDB`, means
> MongoDB must be running on the same computer as this API. Each computer has
> its own local database and records; data is not automatically shared between
> computers.

## Install and run

Open a terminal in the project folder. On a fresh download or Git clone, install
the packages once:

```bash
npm install
```

Start MongoDB Community Server using the method for your operating system.
Then start the API:

```bash
npm start
```

When it starts successfully, the terminal displays messages similar to:

```text
MongoDB connected: studentDB
Server is running on port 3000: http://localhost:3000
```

Keep the terminal open while using the API. Visit
`http://localhost:3000/health` in a browser to check that it is responding.
Stop the server with **Ctrl+C**.

### Environment settings (optional)

No `.env` file is needed for the default local setup. The API defaults to
`mongodb://127.0.0.1:27017/studentDB` and port `3000`.

To use a different MongoDB address or port, copy `.env.example` to `.env` and
edit the values. Keep `.env` private; it is excluded from Git.

## Student data

Every new student must include all four fields:

| Field | Type | Rule |
| --- | --- | --- |
| `name` | string | Must not be empty |
| `email` | string | Must be valid and unique |
| `age` | number | Must be a positive whole number |
| `department` | string | Must not be empty |

Example JSON:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "age": 20,
  "department": "Computer Science"
}
```

MongoDB adds an `_id` to each saved student. Use this ID to retrieve, update,
or delete that student.

## API routes

The base URL is `http://localhost:3000`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check that the API is running |
| `POST` | `/students` | Create a student |
| `GET` | `/students` | List all students |
| `GET` | `/students/:id` | Get a student by MongoDB ID |
| `PUT` or `PATCH` | `/students/:id` | Update one or more fields |
| `DELETE` | `/students/:id` | Delete a student |

The same student routes are also available under `/api/students`.

## Try it in Postman

1. Start the API with `npm start`.
2. To create a student, choose **POST** and enter
   `http://localhost:3000/students`.
3. Select **Body → raw → JSON**, paste the example JSON above, and click
   **Send**. A successful create returns **201 Created** and the new `_id`.
4. To see all students, send **GET** to
   `http://localhost:3000/students`.
5. Copy a student's `_id` from that response. To see just that student, send
   **GET** to `http://localhost:3000/students/PASTE_ID_HERE`.
6. To update, send **PATCH** to that same ID URL with a JSON body containing
   just the fields to change, for example:

   ```json
   {
     "department": "Mathematics"
   }
   ```

7. To delete, send **DELETE** to the student's ID URL. No body is needed.

## View records in MongoDB Compass

Connect Compass to:

```text
mongodb://127.0.0.1:27017
```

Open `studentDB` → `students` → **Documents**. MongoDB creates the database
and collection when the first student is saved. Create a student through the
API first if the collection is not visible yet.

## Common problems

- **`ECONNREFUSED` in Postman:** Start the API with `npm start` and keep its
  terminal open. Make sure you send requests to `localhost:3000`.
- **MongoDB connection error when starting the API:** Make sure MongoDB
  Community Server is installed and its service is running.
- **Port 3000 is already in use:** Stop the other API process with **Ctrl+C**
  in its terminal, or set a different `PORT` in `.env`.
- **`400 Bad Request`:** Check that the request body is valid JSON and has the
  required fields and correct value types.
- **`409 Conflict`:** That email address is already used by another student.
- **`404 Not Found`:** Check the student ID; it may not exist in this database.