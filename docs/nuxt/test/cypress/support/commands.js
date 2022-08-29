// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Cypress.Commands.add("login", ({ username = 'admin' }, { password = 'admin' }, { rememberUser = false } = {}) => {

//   const signInUrl = "http://localhost:3000"
//   const signInPath = "/user/login"
//   cy.visit(signInUrl + signInPath)

//   const log = Cypress.log({
//     name: "login",
//     displayName: "LOGIN",
//     message: [`🔐 Authenticating | ${username}`],
//     // @ts-ignore
//     autoEnd: false,
//   });

//   log.snapshot("before");

//   // Fill out login form fields.
//   cy.get("#edit-name").type(username);
//   cy.get("edit-pass").type(password);

//   // Submit login form.
//   cy.get("edit-submit").click();

//   cy.wait("@loginUser").then((loginUser: any) => {
//     log.set({
//       consoleProps() {
//         return {
//           username,
//           password,
//           // userId: loginUser.response.statusCode !== 401 && loginUser.response.body.user.id,
//         };
//       },
//     });

//     log.snapshot("after");
//     log.end();
//   });
// });

