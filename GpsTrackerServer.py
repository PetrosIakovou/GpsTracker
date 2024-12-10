from flask import Flask
from flask import request,jsonify
import mysql.connector
import json

import requests 
from flask import render_template, session
import datetime
from flask_socketio import SocketIO, emit
from flask_cors import CORS



app = Flask(__name__)
app.secret_key = 'your_secret_key'  # This is necessary for using sessions
print(f"Secret key is: {app.secret_key}")
#CORS(app)  # Enable CORS for all routes
#CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500", "http://192.168.1.100:4000"]}})
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500", "http://160.40.48.227:4000"]}})

socketio = SocketIO(app, cors_allowed_origins="*")
# Global variables to store data
stored_data = {}

@app.route('/addvalue/', methods=['GET'])
def addvalue():


    # Get data from the session
    timestamp = stored_data.get('timestamp', 'Not found')
    date = stored_data.get('date', 'Not found')
    latitude = stored_data.get('latitude', 'Not found')
    longitude = stored_data.get('longitude', 'Not found')
    velocity = stored_data.get('velocity', 'Not found')
    course = stored_data.get('course', 'Not found')
    altitude = stored_data.get('altitude', 'Not found')
    satellites = stored_data.get('satellites', 'Not found')
  #  http://127.0.0.1:4000/addvalue?timestamp=timestamp&date=date&latitude=latitude&longitude=longitude&velocity=velocity&course=course&altitude=altitude&satellites=satellites
        
    mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="ttc"
    )
    
    mycursor = mydb.cursor()
    
    sql = "INSERT INTO sensor (timestamp, date, latitude, longitude, velocity, course, altitude, satellites) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
    val = (timestamp, date, latitude, longitude, velocity, course, altitude, satellites)
    mycursor.execute(sql, val)
    mydb.commit()
    
    print(mycursor.lastrowid)
    
    return "ok"

@app.route('/getvalues/', methods=['GET'])
def getvalues():

    #http://127.0.0.1:4000/getvalues
    mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="ttc"
    )

    mycursor = mydb.cursor()
    
    mycursor.execute("SELECT * FROM sensor")
    myresult = mycursor.fetchall()
    for x in myresult:
        print(x)

    return "ok"

# WebSocket event to send updated data to the browser
@socketio.on('request_data')
def handle_request_data():

    # Get data 
    timestamp = stored_data.get('timestamp', 'Not found')
    date = stored_data.get('date', 'Not found')
    latitude = stored_data.get('latitude', 'Not found')
    longitude = stored_data.get('longitude', 'Not found')
    velocity = stored_data.get('velocity', 'Not found')
    course = stored_data.get('course', 'Not found')
    altitude = stored_data.get('altitude', 'Not found')
    satellites = stored_data.get('satellites', 'Not found')

    # Emit the data to the client
    emit('update_data', {
        'timestamp': timestamp,
        'date': date,
        'latitude': latitude,
        'longitude': longitude,
        'velocity': velocity,
        'course': course,
        'altitude': altitude,
        'satellites': satellites
    })


@app.route('/display')
def display():
    
    # Get data 
   # timestamp = stored_data.get('timestamp', 'Not found')
    #date = stored_data.get('date', 'Not found')
    #latitude = stored_data.get('latitude', 'Not found')
    #longitude = stored_data.get('longitude', 'Not found')
    #velocity = stored_data.get('velocity', 'Not found')
    #course = stored_data.get('course', 'Not found')
    #altitude = stored_data.get('altitude', 'Not found')
    #satellites = stored_data.get('satellites', 'Not found')

   
    
    #return render_template('display.html', title='Κόμβος 12345', timestamp = timestamp, latitude = latitude, longitude = #longitude,  altitude = altitude, velocity = velocity, course = course, satellites = satellites)

    return render_template('display.html', title='Κόμβος 12345')

@app.route('/data', methods=['POST'])
def receive_data():
    try:
        # Parse JSON data from the request
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data received"}), 400
        
        print(f"Received data: {data}")
        

        # Store values in variable
        stored_data['timestamp'] = data['timestamp']
        stored_data['date'] = data['date']
        stored_data['latitude'] = data['latitude']
        stored_data['longitude'] = data['longitude']
        stored_data['velocity'] = data['velocity']
        stored_data['course'] = data['course']
        stored_data['altitude'] = data['altitude']
        stored_data['satellites'] = data['satellites']

        # print("Session after storing data:", session)

        # Optionally, process the data or save it to a database
        # For example:
        # process_data(data)
        mydb = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="ttc"
        )
    
        mycursor = mydb.cursor()
    
        sql = "INSERT INTO sensor (timestamp, date, latitude, longitude, velocity, course, altitude, satellites) VALUES    (%s, %s, %s, %s, %s, %s, %s, %s)"
        val = (str(stored_data['timestamp']), str(stored_data['date']), float(stored_data['latitude']), float(stored_data['longitude']), float(stored_data['velocity']), float(stored_data['course']), float(stored_data['altitude']), int(stored_data['satellites']))
        mycursor.execute(sql, val)
        mydb.commit()
    
        print(mycursor.lastrowid)

        # Return a success response
        return jsonify({"status": "success", "message": "Data received"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500




   
       

#if __name__ == '__main__':
#    app.run(host='0.0.0.0', port='4000')++++++++++
if __name__ == '__main__':
   # socketio.run(app, host='192.168.1.100', port=4000, debug=True) #spiti
   socketio.run(app, host='160.40.48.227', port=4000, debug=True) 