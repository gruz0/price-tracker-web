# README

## [Use HTTP Status Codes and Error Responses](https://github.com/peterboyer/restful-api-design-tips#use-http-status-codes-and-error-responses)

Because we are using HTTP methods, we should use HTTP status codes.
Although a challenge here is to select a distinct slice of these codes,
and then depend on response data to detail any response errors.
Keeping a small set of codes helps you consume and handle errors consistently.

I like to use:

### for Data Errors

* 400 for when the requested information is incomplete or malformed.
* 422 for when the requested information is okay, but invalid.
* 404 for when everything is okay, but the resource doesn’t exist.
* 409 for when a conflict of data exists, even with valid information.

### for Auth Errors

* 401 for when an access token isn’t provided, or is invalid.
* 403 for when an access token is valid, but requires more privileges.

### for Standard Statuses

* 200 for when everything is okay.
* 204 for when everything is okay, but there’s no content to return.
* 500 for when the server throws an error, completely unexpected.

Furthermore, returning responses after these errors is also very important.
I want to consider not only the presentation of the status itself,
but also a reason behind it.

In the case of trying to create a new account, imagine we provide an email
and password. Of course we would like to have our client app prevent
any requests with an invalid email, or password that is too short,
but outsiders have as much access to the API as we do from our client app
when it’s live.

* If the email field is missing, return a 400.
* If the password field is too short, return a 422.
* If the email field isn’t a valid email, return a 422.
* If the email is already taken, return a 409.
