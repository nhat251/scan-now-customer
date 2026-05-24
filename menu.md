Story: [FE] Customer QR Table Session Flow

MockUI: menu.html in codebase
Must match 90% (color will match branding in code, layout must match in mock ui)

The api scalar: https://scannow.onrender.com/scalar/v1   

And this is mobile first (web but responsive) because main customer will use phone.

Description

Build the frontend flow for customers scanning a table QR code to join a dining session and view the menu for that session.

Current flow:

Scan QR
→ Load table information
→ Enter session code
→ Join session
→ View session menu


Customers do not need to log in.

Frontend uses sessionCode to identify the current dining session.

API success and error responses are mapped directly from the backend implementation.

FE Routes

/tables/{qrCodeToken}
/sessions/{sessionCode}/menu


Customer Flow

Step 1 — Customer Scans QR

The real QR code should point to:

domain/tables/{qrCodeToken}


The frontend page will call the API to load table information.

Step 2 — Customer Enters Session Code

If the table status is OCCUPIED:

Customer enters a session code:

A7X9K2


Frontend submits the session code to join the dining session.

Step 3 — Customer Views Menu

After successfully joining:

Frontend redirects to:

/sessions/{sessionCode}/menu


and loads the menu for that session.

APIs

1. Get Table By QR

Endpoint

GET /api/public/tables/{qrCodeToken}


Path Params

qrCodeToken


Success Response (200)

{
  "code": 200,
  "message": "Get table successfully",
  "result": {
    "tableId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
    "branchName": "Bia 3",
    "tableNumber": "A7",
    "status": "OCCUPIED"
  }
}


Table Status Enum

AVAILABLE
OCCUPIED
RESERVED
DISABLED


Error Response — Table Not Found (404)

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Table not found",
  "instance": "/api/public/tables/invalid_token_xyz",
  "traceId": "0HMS8RPT12345"
}


2. Join Session

Endpoint

POST /api/public/sessions/join


Request Body

{
  "sessionCode": "A7X9K2"
}


Session Code Rules

Required
Exactly 6 characters
Uppercase only
A-Z and 2-9


Success Response (200)

{
  "code": 200,
  "message": "Join session successfully",
  "result": {
    "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tableId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
    "tableNumber": "A7",
    "branchName": "Bia 3",
    "expiresAt": "2026-05-23T20:00:00Z"
  }
}


Error Response — Validation Error (400)

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occured",
  "instance": "/api/public/sessions/join",
  "errors": {
    "sessioncode": [
      "sessionCode must be 6 uppercase characters"
    ]
  },
  "traceId": "0HMS8RPT12347"
}


Error Response — Session Expired / Not Found (404)

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Session not found or expired",
  "instance": "/api/public/sessions/join",
  "traceId": "0HMS8RPT12348"
}


3. Get Session Menu

Endpoint

GET /api/public/sessions/{sessionCode}/menu


Path Params

sessionCode


Query Params

pageNumber
pageSize
search
categoryId
isFeatured
sortBy
sortDirection


Example Requests

Search

GET /api/public/sessions/{sessionCode}/menu?search=beer


Filter By Category

GET /api/public/sessions/{sessionCode}/menu?categoryId={categoryId}


Sort By Price

GET /api/public/sessions/{sessionCode}/menu?sortBy=price&sortDirection=asc


Success Response (200)

{
  "code": 200,
  "message": "Get session menu successfully",
  "result": {
    "session": {
      "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tableId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
      "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
      "tableNumber": "A7",
      "branchName": "Bia 3",
      "expiresAt": "2026-05-23T20:00:00Z"
    },
    "menu": {
      "items": [
        {
          "categoryId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
          "categoryName": "Fruit Tea",
          "displayOrder": 1,
          "items": [
            {
              "menuItemId": "9fa85f64-5717-4562-b3fc-2c963f66afa0",
              "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
              "categoryId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
              "categoryName": "Fruit Tea",
              "name": "Peach Orange Lemongrass Tea",
              "description": "Sweet peach tea mixed with fresh lemongrass and orange slices",
              "imageUrl": "https://example.com/tradaocamsa.jpg",
              "price": 39000.0,
              "costPrice": 15000.0,
              "preparationTime": 6,
              "displayOrder": 1,
              "isAvailable": true,
              "isFeatured": true,
              "isActive": true,
              "createdAt": "2026-05-22T09:40:00Z",
              "updatedAt": "2026-05-22T09:50:00Z"
            }
          ]
        }
      ],
      "pageNumber": 1,
      "pageSize": 10,
      "totalItems": 1
    }
  }
}


Error Response — Invalid Sort Field (400)

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid sort field",
  "instance": "/api/public/sessions/A7X9K2/menu",
  "traceId": "0HMS8RPT12349"
}


Error Response — Session Not Found / Expired (404)

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Session not found or expired",
  "instance": "/api/public/sessions/A7X9K2/menu",
  "traceId": "0HMS8RPT12350"
}


4. Get Categories For Filter

Endpoint

GET /api/public/branches/{branchId}/categories


Success Response (200)

{
  "code": 200,
  "message": "Get categories successfully",
  "result": [
    {
      "categoryId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
      "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
      "branchName": "Bia 3",
      "name": "Fruit Tea",
      "description": "Fresh fruit tea menu",
      "imageUrl": "https://example.com/cat-tratraicay.jpg",
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2026-05-22T09:00:00Z",
      "updatedAt": "2026-05-22T09:30:00Z"
    }
  ]
}


Error Response — Branch Not Found (404)

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Branch not found",
  "instance": "/api/public/branches/3fa85f64-5717-4562-b3fc-2c963f66afa9/categories",
  "traceId": "0HMS8RPT12351"
}


Screen 1 — QR Table Page

Route

/tables/{qrCodeToken}


UI Requirements

Display:

Branch Name
Table Number
Table Status
Session Code Input
Join Button


Example UI

Bia 3
Table A7

Enter session code
[ A7X9K2 ]

[ View Menu ]


Table Status Rules

AVAILABLE

Display:

This table has not started a session yet
Please contact staff to begin


Disable:

Session input
Join button


OCCUPIED

Display:

Enter the session code to view menu and place orders


Enable input and button.

RESERVED

Display:

This table is currently reserved


Disable join action.

DISABLED

Display:

This table is currently unavailable


Disable all actions.

Screen 2 — Session Menu Page

Route

/sessions/{sessionCode}/menu


UI Requirements

Header:

Branch Name
Table Number
Session Code


Filters:

Search
Category tabs/dropdown
Featured filter
Sort dropdown


Menu Layout

Render by category group:

Category Name
Menu Item Cards


Menu Item Card

Image
Name
Description
Price
Featured badge
Available status
Add button (UI only)


Temporary Cart UI

Order API is not implemented yet.

Only local state cart is required:

Selected items
Quantity
Subtotal


Mini cart footer:

3 items selected
120.000đ


Future Order Flow (Not Implemented Yet)

Customer selects items
→ Add to cart
→ Submit order
→ Staff confirms
→ Kitchen prepares
→ Payment
→ Session auto closes


Future APIs:

POST /api/public/orders


or:

POST /api/public/sessions/{sessionCode}/orders


Frontend Technical Requirements

Session Persistence

Frontend should persist:

sessionCode
branchId
tableId
expiresAt


so refreshing the page does not lose the session.

Responsive

Customers mainly use mobile devices after scanning QR codes.

UI should be:

Mobile first
Bottom sticky cart
Large touch buttons


Acceptance Criteria

Customer scans QR and opens the correct table page

Successfully loads table information

Correctly displays table status

Join session works properly

Invalid session code shows correct error

Correctly redirects to menu page

Menu loads based on session

Search/filter/sort works

Category filter works

Good mobile responsiveness

Includes loading, empty state, and error state

Session persists after page refresh

