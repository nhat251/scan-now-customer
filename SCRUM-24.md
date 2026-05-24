[FE] Owner Category Management
Description

Build a screen for Owners to manage categories for each branch.

Owner can:

View category list

Search categories

Filter active/inactive categories

Sort categories

Create categories

Edit categories

Activate / deactivate categories

Reorder categories

FE Routes

/owner/branches/{branchId}/categories

/owner/branches/{branchId}/categories/create

/owner/branches/{branchId}/categories/{categoryId}

APIs

GET /api/owner/branches/{branchId}/categories

GET /api/owner/branches/{branchId}/categories/{categoryId}

POST /api/owner/branches/{branchId}/categories

PUT /api/owner/branches/{branchId}/categories/{categoryId}

PATCH /api/owner/branches/{branchId}/categories/reorder

PATCH /api/owner/branches/{branchId}/categories/{categoryId}/active

PATCH /api/owner/branches/{branchId}/categories/{categoryId}/inactive

Query Params

pageNumber

pageSize

search

isActive

sortBy

sortDirection

Create / Update Request Body

{
  "name": "Fruit Tea",
  "description": "Refreshing tropical fruit tea drinks",
  "imageUrl": "https://example.com/cat-fruittea.jpg",
  "displayOrder": 2
}


Reorder Request Body

{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "displayOrder": 2
    },
    {
      "id": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
      "displayOrder": 1
    }
  ]
}


UI Requirements

Category List

Table columns:

Image

Category Name

Description

Display Order

Status

Created At

Updated At

Actions

Actions

View/Edit

Activate

Deactivate

Reorder

Category Form

Fields:

Name

Description

Image URL

Display Order

Validation

Name is required

Display order must be greater than or equal to 0

Image URL must be a valid URL format if provided

Description is optional

Acceptance Criteria

Owner can view categories by branch

Search/filter/sort work correctly

Create category works successfully

Edit category works successfully

Activate/Deactivate works successfully

Reorder works successfully

Has loading state, empty state, and error state

Owner cannot manage branches outside their restaurant ownership

