const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { authenticateToken } = require("../middlewares/jwtmiddleware");
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




  router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    const { data, error } = await supabase.from("accounts").select("*").eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });

    const balance = data.reduce((acc, txn) => 
        acc + (txn.transaction_type === "deposit" ? txn.amount : -txn.amount), 0
    );

    res.json({ transactions: data, balance });
});



router.get("/banker/users", async (req, res) => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) return res.status(400).json({ error: error.message });
    res.json({ transactions: data });
});


router.post("/deposit", async (req, res) => {
    const { userId, amount } = req.body;
    console.log(userId,amount);
    
    const { error } = await supabase.from("accounts").insert([{ user_id: userId, transaction_type: "deposit", amount }]);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Deposit successful" });
});

router.post("/withdraw", async (req, res) => {
    const { userId, amount } = req.body;

    const { data } = await supabase.from("accounts").select("*").eq("user_id", userId);
    console.log(data);
    
    const balance = data.reduce((acc, txn) => acc + (txn.transaction_type === "deposit" ? txn.amount : -txn.amount), 0);
    console.log(balance);
    
    if (amount > balance) return res.status(400).json({ error: "Insufficient funds" });

    const { error } = await supabase.from("accounts").insert([{ user_id: userId, transaction_type: "withdrawal", amount }]);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Withdrawal successful" });
});

module.exports = router;