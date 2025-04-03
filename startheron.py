import os
import http.server
import socketserver

PORT = 8000

# Set the CGI handler
handler = http.server.CGIHTTPRequestHandler
handler.cgi_directories = ["/cgi-bin/"]


# Change to the directory where startheron.py is located
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Disable the automatic opening of a web browser
handler.dont_inherit = True

# Start the server
with socketserver.TCPServer(("localhost", PORT), handler) as httpd:
    print("Serving on port", PORT)
    print("Open your web browser and navigate to http://localhost:8000")

    # Serve until interrupted
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer interrupted. Exiting...")
