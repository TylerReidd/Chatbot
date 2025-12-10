import {User, sanitizeUser, UserRoles} from '../models/User.js'

export const signup = async (req, res) => {
  try {
    const {name, email, password} = req.body;

    if(!email || !password || !name) {
      return res.status(400).json({error: 'Name, email, and password are required.'});
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({email:normalizedEmail})
    if(existing) {
      return res.status(409).json({error: "Email is already registered."});
    }

    const user = await User.create({
      name: name.trim(),
      email:normalizedEmail,
      password,
      role: UserRoles.REPRESENTATIVE});
    const token = user.generateAuthToken()

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err)
    res.status(500).json({error: "Signup failed."})
  }
}