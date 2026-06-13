[FE] Owner Price Management
Description

Build a feature for Owners to update menu item prices and view price history.

This feature can be integrated into:

/owner/menu-items/{menuItemId}

under tabs:

Overview

Price History

FE Route

/owner/menu-items/{menuItemId}/price-history

APIs

PATCH /api/owner/menu-items/{menuItemId}/price

GET /api/owner/menu-items/{menuItemId}/price-history

Update Price Request Body

{
  "price": 42000.0,
  "note": "Price adjusted due to increased seasonal costs of fresh peaches and oranges"
}


UI Requirements

Update Price Modal

Fields:

Current Price

New Price

Note

Buttons:

Cancel

Update Price

Price History Table

Columns:

Old Price

New Price

Changed By

Changed At

Note

Validation

New price is required

New price must be greater than 0

Note is optional, but should be encouraged for better audit tracking

Acceptance Criteria

Owner can update prices successfully

New price is reflected immediately in menu item detail

Price history displays correctly

Has loading state while updating

Has success/error toast notifications

Owner cannot update items outside their restaurant ownership

