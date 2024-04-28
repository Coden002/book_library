const http = require('http');
const fs = require('fs');
const path = require('path');

const usersDbPath = path.join(__dirname, "db", 'users.json');
let usersDB = [];

const booksDbPath = path.join(__dirname, "db", 'books.json');
let booksDB = [];

const port = process.env.PORT || 3000

const HOST_NAME = 'localhost';

const requestHandler = async function (req, res) {
    res.setHeader("Content-Type", "application/json");

    if (req.url === '/users' && req.method === 'POST') {
        addUser(req, res);

    } else if (req.url === '/users' && req.method === 'GET') {
        getAllUsers(req, res);
    
    }  else if (req.url === '/users/auth' && req.method === 'POST') {
        authenticateUsers(req, res)

    
    } else if (req.url === '/books' && req.method === 'GET') {
        getAllBooks(req, res);

    } else if (req.url === '/books' && req.method === 'POST') {
        authentication(req, res)
            .then((book)=> {
                addBook(req, res, book);
             })
            .catch((err) => {
                res.statusCode = 401;
                res.end(JSON.stringify({
                    error: err
                }));
            });
    } else if (req.url === '/books' && req.method === 'DELETE') {
        authentication(req, res)
            .then((book)=> {
                deleteBook(req, res, book);
             })
            .catch((err) => {
                res.statusCode = 401;
                res.end(JSON.stringify({
                    error: err
                }));
            });
    } else if (req.url === '/books/loan' && req.method === 'PUT') {
        authentication(req, res)
            .then((book)=> {
                loanBook(req, res, book);
            })
            .catch((err) => {
                res.statusCode = 401;
                res.end(JSON.stringify({
                    error: err
                }));
            });
    } else if (req.url === '/books' && req.method === 'PUT') {
        authentication(req, res)
            .then((book)=> {
                updateBook(req, res, book);
            })
            .catch((err) => {
                res.statusCode = 401;
                res.end(JSON.stringify({
                    error: err
                }));
            });
    } else if (req.url === '/books/return' && req.method === 'PUT') {
        authentication(req, res)
            .then((book)=> {
                returnBook(req, res, book);
            })
            .catch((err) => {
                res.statusCode = 401;
                res.end(JSON.stringify({
                    error: err
                }));
            });

    } else {
            res.writeHead(404);
            res.end(JSON.stringify({
                message: 'Method Not Supported'
            }));
        }
}


// CREATE A USER
const addUser = function (req, res) {
    const body = [];

    req.on('data', (chunk) => {
        body.push(chunk); 
    });

    req.on('end', () => {
        const parsedBody = Buffer.concat(body).toString();
        const newUser = JSON.parse(parsedBody);

        //save to db
        usersDB.push(newUser);
        fs.writeFile(usersDbPath, JSON.stringify(usersDB), (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end(JSON.stringify({
                    message: 'Internal Server Error. Could not save user to database.',
                    status: "failed"
                }));
            }

            res.end(JSON.stringify({
                message:"User added successfully!",
                data: newUser
            }));
        });
    });
}

// GET USERS
function getAllUsers(req, res) {
    fs.readFile(usersDbPath, "utf8", (err, users) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }

        res.end(users);

    })
}


// CALLBACK GET USERS FUNCTION
function getUsers() {
    return new Promise((resolve, reject) => {
        fs.readFile(usersDbPath, "utf8", (err, users) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(users));
        })
    })
}

// USER AUTHENTICATION
function authenticateUsers(req, res) {
        const body = [];

        req.on('data', (chunk) => {
            body.push(chunk);
        });

        req.on('end', async () => {
            const parsedBody = Buffer.concat(body).toString();
            if (!parsedBody) {
                res.end(JSON.stringify("Please enter your username and password"));
            }

            const loginDetails = JSON.parse(parsedBody);

            const users = await getUsers ();
            const userFound = users.find(user => user.username === loginDetails.username && user.password === loginDetails.password);

            if (!userFound) {
                res.end(JSON.stringify("Username or password incorrect"));
            }

            res.end(JSON.stringify({
                message: "User found", 
                Data: userFound
            }))

        });
}



// AUTHENTICATION: FOR BOOKS ROUTE
function authentication(req, res) {
    return new Promise((resolve, reject) => {
        const body = [];

        req.on('data', (chunk) => {
            body.push(chunk);
        });

        req.on('end', async () => {
            const parsedBody = Buffer.concat(body).toString();
            if (!parsedBody) {
                reject("Please enter your username and password");
            }

            const [loginDetails, book] = JSON.parse(parsedBody);
            const users = await getUsers();
            const userFound = users.find(user =>
                user.username === loginDetails.username && user.password === loginDetails.password
            );

            if (!userFound) {
                reject("Username or password incorrect");
            }

            resolve(book)

        });
    })
}

// GET BOOKS
const getAllBooks = function (req, res) {
    fs.readFile(booksDbPath, "utf8", (err, books) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }

        res.end(books);

    })
}

// CREATE A BOOK
const addBook = function (req, res, newBook) {
    
    fs.readFile(booksDbPath, "utf8", (err, data) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }

        const oldBooks = JSON.parse(data)

        // get ID of last book in the database
        const lastBook = oldBooks[oldBooks.length - 1];
        const lastBookId = lastBook.id;
        newBook.id = lastBookId + 1;

        const allBooks = [...oldBooks, newBook]

        fs.writeFile(booksDbPath, JSON.stringify(allBooks), (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end(JSON.stringify({
                    message: 'Internal Server Error. Could not save book to database.'
                }));
            }

            res.end(JSON.stringify({
                message: "Book has been created successfully!",
                data: newBook
            }));
        });

    })
}

// DELETE A BOOK
function deleteBook(req, res, bookToDelete) {

    fs.readFile(booksDbPath, "utf8", (err, data) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }
        const booksObj = JSON.parse(data)

        const bookIndex = booksObj.findIndex(book =>
            book.title === bookToDelete.title && book.author === bookToDelete.author
        );

        if (bookIndex == -1) {
            res.writeHead(404)
            res.end(JSON.stringify({
                message:"Invalid book details provided"
            }));
            return
        }
        // DELETE FUNCTION
        booksObj.splice(bookIndex, 1)

        fs.writeFile(booksDbPath, JSON.stringify(booksObj), (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end(JSON.stringify({
                    message: 'Internal Server Error. Could not save book to database.'
                }));
            }

            res.writeHead(200)
            res.end(JSON.stringify({
                message: "Book Deletion successfull!"
            }));
        })
    })
}

// LOAN A BOOK
const loanBook = function (req, res, bookToloan) {
    
    fs.readFile(booksDbPath, "utf8", (err, data) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }

        const booksObj = JSON.parse(data)

        const bookIndex = booksObj.findIndex(book =>
            book.title === bookToloan.title && book.author === bookToloan.author && book.loaned === false
        );
        
        if (bookIndex == -1) {
            res.writeHead(404);
            res.end(JSON.stringify({
                message:"Book is not available"
            }));
            return;
        }
        
        // Change the loaned key in the books db to true
        booksObj[bookIndex].loaned = true

        // update the book in the database
        booksObj[bookIndex] = { ...booksObj[bookIndex], ...bookToloan };

        fs.writeFile(booksDbPath, JSON.stringify(booksObj), (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end(JSON.stringify({
                    message: 'Internal Server Error. Could not save book to database.'
                }));
            }

            res.end(JSON.stringify({
                message: "Book loaned out successfully!",
                data: booksObj[bookIndex]
            }));
        });

    })
}

// RETURN A BOOK
const returnBook = function (req, res, bookToReturn) {
    
    fs.readFile(booksDbPath, "utf8", (err, data) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }

        const booksObj = JSON.parse(data)

        const bookIndex = booksObj.findIndex(book =>
            book.title === bookToReturn.title && book.author === bookToReturn.author && book.loaned === true
        );
        
        if (bookIndex == -1) {
            res.writeHead(404);
            res.end(JSON.stringify({
                message:"No such book loaned out"
            }));
            return;
        }
        
        // Change the loaned key in the books db to false
        booksObj[bookIndex].loaned = false

        // update the book in the database
        booksObj[bookIndex] = { ...booksObj[bookIndex], ...bookToReturn };

        fs.writeFile(booksDbPath, JSON.stringify(booksObj), (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end(JSON.stringify({
                    message: 'Internal Server Error. Could not save book to database.'
                }));
            }

            res.end(JSON.stringify({
                message: "Book returned successfully!",
                data: booksObj[bookIndex]
            }));
        });

    })
}

// UPDATE A BOOK 
const updateBook = function (req, res, bookToUpdate) {
    
    fs.readFile(booksDbPath, "utf8", (err, data) => {
        if (err) {
            console.log(err)
            res.writeHead(400)
            res.end("An error occured")
        }

        const booksObj = JSON.parse(data)

        const bookIndex = booksObj.findIndex(book =>
            book.id === bookToUpdate.id
        );
        
        if (bookIndex == -1) {
            res.writeHead(404);
            res.end(JSON.stringify({
                message:"Book not found"
            }));
            return
        }

        // update the book in the database
        booksObj[bookIndex] = { ...booksObj[bookIndex], ...bookToUpdate };
        // save to db
        fs.writeFile(booksDbPath, JSON.stringify(booksObj), (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end(JSON.stringify({
                    message: 'Internal Server Error. Could not save book to database.'
                }));
            }

            res.end(JSON.stringify({
                message: "Book updated successfully!",
                data: booksObj[bookIndex]
            }));
        });

    })
}


// Create server
const server = http.createServer(requestHandler)

server.listen(port, HOST_NAME, () => {
    booksDB = JSON.parse(fs.readFileSync(booksDbPath, 'utf8'));
    usersDB = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
    console.log(`Server is listening on ${HOST_NAME}:${port}`)
})