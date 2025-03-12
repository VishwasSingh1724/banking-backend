const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );



router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    console.log(name,email,password);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await supabase.auth.getUser();
    // Insert into Supabase
    const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password: hashedPassword, role:"customer" }])
    .select("*");

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "User registered successfully", user: data });
});


router.post("/login", async (req, res) => {
    const { email, password, role } = req.body; // Get role from request body
    console.log(email, password, role);
  
    if (!role || (role !== "customer" && role !== "banker")) {
      return res.status(400).json({ error: "Invalid role" });
    }
  
    // Fetch user based on email and role
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", role)
      .single();
  
    if (error || !data || !(await bcrypt.compare(password, data.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  
    // Generate JWT token
    const token = jwt.sign(
      { id: data.id, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  if(role =="banker"){
    res.json({ token, user: { id: data.id, name: data.name, role: data.role,isAdmin:true } });
  }else{
    res.json({ token, user: { id: data.id, name: data.name, role: data.role } });
  }
  });
  
module.exports = router;
