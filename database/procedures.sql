-- Create user
CREATE OR ALTER PROCEDURE spCreateUser
  @Username NVARCHAR(100),
  @PasswordHash NVARCHAR(200)
AS
BEGIN
  INSERT INTO dbo.Users (Username, PasswordHash)
  VALUES (@Username, @PasswordHash);
END
GO

-- Get user by username
CREATE OR ALTER PROCEDURE spGetUserByUsername
  @Username NVARCHAR(100)
AS
BEGIN
  SELECT * FROM dbo.Users WHERE Username = @Username;
END
GO

-- Fetch items for a given user
CREATE OR ALTER PROCEDURE spGetItemsForUser
  @UserId INT
AS
BEGIN
  SELECT * FROM dbo.Items WHERE UserId = @UserId;
END
GO