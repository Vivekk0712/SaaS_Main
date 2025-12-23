-- Verify Test Data for WhatsApp Notifications
-- Run this to check if students and parents are set up correctly

USE sas;

-- Check if CLASS 1 exists
SELECT 'Checking CLASS 1...' AS Status;
SELECT id, name FROM classes WHERE name = 'CLASS 1';

-- Check if Section A exists
SELECT 'Checking Section A...' AS Status;
SELECT s.id, s.name, c.name as class_name 
FROM sections s 
JOIN classes c ON s.class_id = c.id 
WHERE c.name = 'CLASS 1' AND s.name = 'A';

-- Check test students with parent details
SELECT 'Checking Test Students...' AS Status;
SELECT 
  s.usn,
  s.name as student_name,
  c.name as class_name,
  sec.name as section_name,
  p.name as parent_name,
  p.phone as parent_phone,
  CASE 
    WHEN p.phone IS NULL THEN '❌ NO PHONE'
    WHEN p.phone LIKE '900%' THEN '⚠️  DEMO NUMBER'
    ELSE '✅ REAL NUMBER'
  END as phone_status
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN sections sec ON s.section_id = sec.id
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE s.usn IN ('1A01', '1A02')
ORDER BY s.usn;

-- Count all students in CLASS 1 - A
SELECT 'Total Students in CLASS 1 - A:' AS Status;
SELECT COUNT(*) as total_students
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN sections sec ON s.section_id = sec.id
WHERE c.name = 'CLASS 1' AND sec.name = 'A';

-- Count students with real phone numbers
SELECT 'Students with Real Phone Numbers:' AS Status;
SELECT COUNT(*) as students_with_real_phones
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN sections sec ON s.section_id = sec.id
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE c.name = 'CLASS 1' 
  AND sec.name = 'A'
  AND p.phone IS NOT NULL
  AND p.phone NOT LIKE '900%';

-- Show all parent phones in CLASS 1 - A
SELECT 'All Parent Phones in CLASS 1 - A:' AS Status;
SELECT 
  s.usn,
  s.name as student,
  p.phone,
  CASE 
    WHEN p.phone LIKE '900%' THEN 'DEMO'
    ELSE 'REAL'
  END as type
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN sections sec ON s.section_id = sec.id
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE c.name = 'CLASS 1' AND sec.name = 'A'
ORDER BY 
  CASE WHEN p.phone LIKE '900%' THEN 1 ELSE 0 END,
  s.usn;

-- Final summary
SELECT 'Test Data Summary:' AS Status;
SELECT 
  (SELECT COUNT(*) FROM students s 
   JOIN classes c ON s.class_id = c.id 
   JOIN sections sec ON s.section_id = sec.id 
   WHERE c.name = 'CLASS 1' AND sec.name = 'A') as total_students,
  (SELECT COUNT(*) FROM students s 
   JOIN classes c ON s.class_id = c.id 
   JOIN sections sec ON s.section_id = sec.id 
   LEFT JOIN parents p ON s.guardian_id = p.id
   WHERE c.name = 'CLASS 1' AND sec.name = 'A' AND p.phone IS NOT NULL) as with_phone,
  (SELECT COUNT(*) FROM students s 
   JOIN classes c ON s.class_id = c.id 
   JOIN sections sec ON s.section_id = sec.id 
   LEFT JOIN parents p ON s.guardian_id = p.id
   WHERE c.name = 'CLASS 1' AND sec.name = 'A' 
   AND p.phone IS NOT NULL AND p.phone NOT LIKE '900%') as real_phones,
  (SELECT COUNT(*) FROM students s 
   WHERE s.usn IN ('1A01', '1A02')) as test_students;
