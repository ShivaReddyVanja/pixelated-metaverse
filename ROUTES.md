# API Routes Documentation

## /signup

**Method:** POST  
**Description:** User signup route.  
**Input:** 
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
**Response:**
- 201: User created successfully, please login!
- 400: Data validation failed.
- 409: Username or email already exists.
- 500: Internal server error.

## /signin

**Method:** POST  
**Description:** User signin route.  
**Input:** 
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:**
- 200: Login successful.
- 400: Data validation failed.
- 404: Username or email does not exist.
- 401: Invalid password.
- 409: Prisma error.
- 500: Internal server error.

## /maps

**Method:** GET  
**Description:** Get all maps.  
**Input:** None  
**Response:**
- 200: Maps retrieved successfully.
- 500: Internal server error.

## /admin/upload-map

**Method:** POST  
**Description:** Upload a new map (Admin only).  
**Input:** 
```json
{
  "name": "string",
  "width": "number",
  "height": "number",
  "thumbnail": "string",
  "data": "string"
}
```
**Response:**
- 201: Map created successfully.
- 400: Validation failed.
- 409: Prisma error.
- 500: Internal server error.

## /space/create

**Method:** POST  
**Description:** Create a new space (Authenticated users only).  
**Input:** 
```json
{
  "name": "string",
  "description": "string",
  "mapId": "string"
}
```
**Response:**
- 201: Space created successfully.
- 400: Validation failed.
- 500: Internal server error.

## /space

**Method:** GET  
**Description:** Get all spaces for the authenticated user.  
**Input:** None  
**Response:**
- 200: Spaces retrieved successfully.
- 404: User does not exist.
- 500: Internal server error.

## /space/start

**Method:** POST  
**Description:** Start a space (Implementation pending).  
**Input:** None  
**Response:**
- 501: Not implemented.

### Notes
- All routes under `/space` and `/admin` require authentication.
- JWT token should be included in the `Authorization` header for authenticated routes.
