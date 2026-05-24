[FE] Owner Menu Item Management
Description

Build a screen for Owners to manage menu items for each branch.

Owner can:

View menu item list

Search menu items

Filter by category

Filter active/inactive items

Filter available/out of stock items

Filter featured items

Create menu items

Edit menu items

Activate / deactivate menu items

Toggle item availability

Toggle featured status

Bulk update availability

Reorder menu items

FE Routes

/owner/branches/{branchId}/menu-items

/owner/branches/{branchId}/menu-items/create

/owner/menu-items/{menuItemId}

APIs

GET /api/owner/branches/{branchId}/menu-items

GET /api/owner/menu-items/{menuItemId}

POST /api/owner/branches/{branchId}/categories/{categoryId}/menu-items

PUT /api/owner/menu-items/{menuItemId}

PATCH /api/owner/menu-items/{menuItemId}/active

PATCH /api/owner/menu-items/{menuItemId}/inactive

PATCH /api/owner/branches/{branchId}/menu-items/reorder

PATCH /api/owner/menu-items/{menuItemId}/toggle-available

PATCH /api/owner/branches/{branchId}/menu-items/bulk-availability

PATCH /api/owner/menu-items/{menuItemId}/toggle-featured

Query Params

pageNumber

pageSize

search

isActive

isAvailable

isFeatured

categoryId

sortBy

sortDirection

Create Request Body

{
  "name": "Peach Lemongrass Tea",
  "description": "Sweet peach tea mixed with fresh lemongrass and orange slices",
  "imageUrl": "https://example.com/peach-lemongrass-tea.jpg",
  "price": 39000.0,
  "costPrice": 15000.0,
  "preparationTime": 6,
  "displayOrder": 1,
  "isAvailable": true,
  "isFeatured": false
}


Update Request Body

{
  "categoryId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
  "name": "Special Peach Lemongrass Tea",
  "description": "Upgraded version with crunchy peach jelly",
  "imageUrl": "https://example.com/peach-lemongrass-special.jpg",
  "costPrice": 17000.0,
  "preparationTime": 7,
  "displayOrder": 1,
  "isAvailable": true,
  "isFeatured": true
}


UI Requirements

Menu Item List

Table columns:

Image

Name

Category

Price

Cost Price

Preparation Time

Available

Featured

Active

Display Order

Actions

Filters

Search

Category

Active / Inactive

Available / Out of Stock

Featured

Actions

View/Edit

Activate

Deactivate

Toggle Available

Toggle Featured

Update Price

Price History

Menu Item Form

Fields:

Category

Name

Description

Image URL

Price

Cost Price

Preparation Time

Display Order

Available

Featured

Validation

Category is required

Name is required

Price must be greater than or equal to 0 when creating

Cost price must be greater than or equal to 0

Preparation time must be greater than or equal to 0

Display order must be greater than or equal to 0

Image URL must be a valid URL format if provided

Acceptance Criteria

Owner can view menu items by branch

Search/filter work correctly

Create menu item works successfully

Edit menu item works successfully

Activate/Deactivate works successfully

Toggle available works successfully

Toggle featured works successfully

Bulk availability works successfully

Reorder menu items works successfully

Has loading state, empty state, and error state

