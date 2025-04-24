import cgi

storage = cgi.FieldStorage()
data = storage.getvalue('data')