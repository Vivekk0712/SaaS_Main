#!/bin/bash

# Test script for attendance_alert template
# Make sure the WhatsApp plugin is running on port 4100

echo "Testing attendance_alert template..."
echo ""

curl -X POST http://localhost:4100/api/v1/message-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-school",
    "type": "transactional",
    "templateName": "attendance_alert",
    "language": "en",
    "payload": {
      "student_name": "Rahul",
      "status": "Absent",
      "date": "2025-11-17"
    },
    "recipients": [
      {
        "phone": "+918850623515",
        "name": "Test Parent"
      }
    ]
  }'

echo ""
echo ""
echo "Check the response above for success or error messages."
echo "If successful, check WhatsApp for the message."
