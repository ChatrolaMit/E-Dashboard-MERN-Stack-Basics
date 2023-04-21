const express = require('express')
const cors = require("cors")
const Jwt = require("jsonwebtoken")
const jwtKey = 'e-comm';

require('./db/config');
const User = require('./db/User') 
const Product = require('./db/Product')

const app = express();


app.use(express.json())
app.use(cors())

app.post('/register',async (req , res)=>{
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    console.log(result)

    if(user){
        Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err , token)=>{
            if(err){
                res.send({result:"something went wrong, please try after some time"})
            }
            res.send({user:result , auth:token})
        })
    }
})

app.post('/login', async (req,res)=>{
    console.log(res.body)

    if(req.body.password && req.body.email){

        let user = await User.findOne(req.body).select("-password");
        if(user){
            Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err , token)=>{
                if(err){
                    res.send({result:"something went wrong, please try after some time"})
                }
                res.send({user , auth:token})
            })
        }
        else{
            res.send({result:"no user found"})
        }
    }
    else{
        res.send({result:"Please fill all Field"})
    }

})

app.post('/add-product', verifyToken,async (req,res)=>{
    let data = req.body
    console.log(data)
    if((data.name && data.price && data.category && data.company && data.userId )){

        let product = new Product(req.body)
        let result = await product.save();
        res.send(result)
    }
    else{
        res.send({result:"Please Enter all filed"})
    }
})

app.get('/products',verifyToken,async (req,res)=>{
    let products =await Product.find({});
    if(products){
        return res.send(products)
    }
    else{
        return res.send({result:"No any Products"})
    }
})

app.delete('/product/:id',verifyToken,async(req,res)=>{
    const id = req.params.id;
    const result = await Product.deleteOne({_id:id})
    if(result.deletedCount){  
        res.send({result:true}) 
    } 
    else{
        res.send({result:false}) 
    }
}) 

app.get('/product/:id',verifyToken,async(req,res)=>{
    id = req.params.id 
    if(id.length==24){

        const result = await Product.findOne({_id:id})
        if(result){
            res.send(result)
        }else{
            res.send({result:"No Record Found"})
        }
    }
    else{
        res.send({result:"Please Enter valid Record"})
    }

})

app.put("/product/:id",verifyToken,async(req,res)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {$set:req.body},
        )
    // console.log(result)
    res.send(result)

})

app.get('/search/:key',verifyToken, async(req,res)=>{
    let result = await Product.find({
        "$or":[ 
            {name:{$regex:req.params.key}},
            {company:{$regex:req.params.key}},
            {category:{$regex:req.params.key}},
        ]
    })
    res.send(result)
})

app.get('/',(req,res)=>{
    res.send("api in progress...")
})


function verifyToken(req,res,next){
    let token = req.headers['authorization']
    
    
    console.warn("middle ware code...",token)
    if(token && token.split(' ').length >1){
        token = token.split(' ');
        token=token[1]
        console.log(token)
        Jwt.verify(token,jwtKey,(err, valid)=>{
            if(err){
                res.status(401).send({result:"invalid token"})
            }else{
                next();
            }
        })
        
    }else{
        res.status(403).send({result:"token not found"})
    }

    
}

app.listen(5000);