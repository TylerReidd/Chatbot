import mongoose from 'mongoose'
import { User, UserRoles, sanitizeUser } from '../models/User.js'

const normalizeCourseName = (value) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const employeeQueryForManager = (managerId) => ({
  managerId,
  role: { $in: [UserRoles.EMPLOYEE, UserRoles.REPRESENTATIVE] },
})

export const getManagedEmployees = async (req, res) => {
  try {
    const employees = await User.find(employeeQueryForManager(req.user._id))
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      employees: employees.map((employee) => sanitizeUser(employee)),
    })
  } catch (error) {
    console.error('Manager employee list error:', error)
    return res.status(500).json({ error: 'Unable to load employees.' })
  }
}

export const addEmployeeByEmail = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ error: 'Employee email is required.' })
    }

    const employee = await User.findOne({ email })
    if (!employee) {
      return res.status(404).json({ error: 'No user found with that email.' })
    }

    const normalizedRole =
      employee.role === UserRoles.REPRESENTATIVE ? UserRoles.EMPLOYEE : employee.role
    if (normalizedRole !== UserRoles.EMPLOYEE) {
      return res.status(400).json({ error: 'Only employee accounts can be assigned to a manager.' })
    }

    if (employee.managerId && String(employee.managerId) !== String(req.user._id)) {
      return res.status(409).json({ error: 'Employee is already assigned to another manager.' })
    }

    employee.managerId = req.user._id
    await employee.save()

    return res.json({ employee: sanitizeUser(employee) })
  } catch (error) {
    console.error('Manager add employee error:', error)
    return res.status(500).json({ error: 'Unable to add employee.' })
  }
}

export const assignCourse = async (req, res) => {
  try {
    const course = normalizeCourseName(req.body?.course)
    const employeeId = req.body?.employeeId

    if (!course) {
      return res.status(400).json({ error: 'Course name is required.' })
    }

    const assignUpdate = {
      $addToSet: { assignedCourses: course },
    }

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ error: 'Invalid employee id.' })
      }

      const employee = await User.findOne({
        _id: employeeId,
        ...employeeQueryForManager(req.user._id),
      })

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found for this manager.' })
      }

      await User.updateOne({ _id: employee._id }, assignUpdate)
      const refreshed = await User.findById(employee._id).lean()
      return res.json({
        scope: 'single',
        employee: sanitizeUser(refreshed),
      })
    }

    const result = await User.updateMany(employeeQueryForManager(req.user._id), assignUpdate)
    return res.json({
      scope: 'all',
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
    })
  } catch (error) {
    console.error('Manager assign course error:', error)
    return res.status(500).json({ error: 'Unable to assign course.' })
  }
}
