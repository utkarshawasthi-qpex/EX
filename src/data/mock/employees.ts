import type { Employee } from '@/types'

export const mockEmployees: Employee[] = [
  { id: 'emp_001', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@questionpro.example', department: 'Engineering', location: 'San Francisco', jobTitle: 'VP Engineering', hireDate: '2018-03-12', status: 'active', managerId: 'emp_001' },
  { id: 'emp_002', firstName: 'Marcus', lastName: 'Chen', email: 'marcus.chen@questionpro.example', department: 'Engineering', location: 'Austin', jobTitle: 'Engineering Manager', hireDate: '2019-07-22', status: 'active', managerId: 'emp_001' },
  { id: 'emp_003', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@questionpro.example', department: 'Engineering', location: 'Remote', jobTitle: 'Senior Frontend Engineer', hireDate: '2020-01-15', status: 'active', managerId: 'emp_002' },
  { id: 'emp_004', firstName: 'Daniel', lastName: 'Brooks', email: 'daniel.brooks@questionpro.example', department: 'Engineering', location: 'New York', jobTitle: 'Backend Engineer', hireDate: '2021-05-03', status: 'active', managerId: 'emp_002' },
  { id: 'emp_005', firstName: 'Amelia', lastName: 'Garcia', email: 'amelia.garcia@questionpro.example', department: 'Engineering', location: 'London', jobTitle: 'QA Automation Lead', hireDate: '2020-09-28', status: 'active', managerId: 'emp_002' },
  { id: 'emp_006', firstName: 'Noah', lastName: 'Patel', email: 'noah.patel@questionpro.example', department: 'Engineering', location: 'San Francisco', jobTitle: 'DevOps Engineer', hireDate: '2022-02-17', status: 'on_leave', managerId: 'emp_002' },

  { id: 'emp_007', firstName: 'Elena', lastName: 'Morris', email: 'elena.morris@questionpro.example', department: 'Product', location: 'San Francisco', jobTitle: 'Chief Product Officer', hireDate: '2017-11-06', status: 'active', managerId: 'emp_007' },
  { id: 'emp_008', firstName: 'Owen', lastName: 'Kim', email: 'owen.kim@questionpro.example', department: 'Product', location: 'Austin', jobTitle: 'Product Manager', hireDate: '2020-04-20', status: 'active', managerId: 'emp_007' },
  { id: 'emp_009', firstName: 'Aisha', lastName: 'Rahman', email: 'aisha.rahman@questionpro.example', department: 'Product', location: 'Remote', jobTitle: 'Product Designer', hireDate: '2021-08-09', status: 'active', managerId: 'emp_007' },
  { id: 'emp_010', firstName: 'Lucas', lastName: 'Evans', email: 'lucas.evans@questionpro.example', department: 'Product', location: 'New York', jobTitle: 'UX Researcher', hireDate: '2022-06-14', status: 'inactive', managerId: 'emp_008' },
  { id: 'emp_011', firstName: 'Maya', lastName: 'Singh', email: 'maya.singh@questionpro.example', department: 'Product', location: 'London', jobTitle: 'Product Operations Manager', hireDate: '2019-12-02', status: 'active', managerId: 'emp_007' },

  { id: 'emp_012', firstName: 'Grace', lastName: 'Taylor', email: 'grace.taylor@questionpro.example', department: 'Sales', location: 'New York', jobTitle: 'VP Sales', hireDate: '2016-10-11', status: 'active', managerId: 'emp_012' },
  { id: 'emp_013', firstName: 'Ethan', lastName: 'Wilson', email: 'ethan.wilson@questionpro.example', department: 'Sales', location: 'Austin', jobTitle: 'Account Executive', hireDate: '2020-03-18', status: 'active', managerId: 'emp_012' },
  { id: 'emp_014', firstName: 'Sophia', lastName: 'Martinez', email: 'sophia.martinez@questionpro.example', department: 'Sales', location: 'San Francisco', jobTitle: 'Sales Development Manager', hireDate: '2021-01-25', status: 'active', managerId: 'emp_012' },
  { id: 'emp_015', firstName: 'Liam', lastName: 'Anderson', email: 'liam.anderson@questionpro.example', department: 'Sales', location: 'Remote', jobTitle: 'Customer Success Manager', hireDate: '2022-09-07', status: 'on_leave', managerId: 'emp_012' },
  { id: 'emp_016', firstName: 'Chloe', lastName: 'Robinson', email: 'chloe.robinson@questionpro.example', department: 'Sales', location: 'London', jobTitle: 'Enterprise Account Executive', hireDate: '2019-04-30', status: 'active', managerId: 'emp_012' },

  { id: 'emp_017', firstName: 'Hannah', lastName: 'Lee', email: 'hannah.lee@questionpro.example', department: 'HR', location: 'San Francisco', jobTitle: 'Chief People Officer', hireDate: '2017-02-13', status: 'active', managerId: 'emp_017' },
  { id: 'emp_018', firstName: 'Benjamin', lastName: 'Clark', email: 'benjamin.clark@questionpro.example', department: 'HR', location: 'New York', jobTitle: 'People Partner', hireDate: '2020-08-24', status: 'active', managerId: 'emp_017' },
  { id: 'emp_019', firstName: 'Isabella', lastName: 'Wright', email: 'isabella.wright@questionpro.example', department: 'HR', location: 'Remote', jobTitle: 'Talent Acquisition Lead', hireDate: '2021-11-10', status: 'active', managerId: 'emp_017' },
  { id: 'emp_020', firstName: 'Mason', lastName: 'Hall', email: 'mason.hall@questionpro.example', department: 'HR', location: 'Austin', jobTitle: 'HRIS Analyst', hireDate: '2022-01-19', status: 'inactive', managerId: 'emp_017' },
  { id: 'emp_021', firstName: 'Zoe', lastName: 'Carter', email: 'zoe.carter@questionpro.example', department: 'HR', location: 'London', jobTitle: 'Learning Program Manager', hireDate: '2019-06-03', status: 'active', managerId: 'emp_017' },

  { id: 'emp_022', firstName: 'Jack', lastName: 'Mitchell', email: 'jack.mitchell@questionpro.example', department: 'Operations', location: 'Austin', jobTitle: 'Director of Operations', hireDate: '2018-09-17', status: 'active', managerId: 'emp_022' },
  { id: 'emp_023', firstName: 'Nora', lastName: 'Scott', email: 'nora.scott@questionpro.example', department: 'Operations', location: 'Remote', jobTitle: 'Business Operations Analyst', hireDate: '2021-03-05', status: 'active', managerId: 'emp_022' },
  { id: 'emp_024', firstName: 'Leo', lastName: 'Adams', email: 'leo.adams@questionpro.example', department: 'Operations', location: 'New York', jobTitle: 'Finance Operations Manager', hireDate: '2020-10-26', status: 'active', managerId: 'emp_022' },
  { id: 'emp_025', firstName: 'Ruby', lastName: 'Turner', email: 'ruby.turner@questionpro.example', department: 'Operations', location: 'London', jobTitle: 'Workplace Coordinator', hireDate: '2019-01-08', terminationDate: '2025-05-30', status: 'terminated', managerId: 'emp_022' },
]
