const {Schema,model} = require('mongoose')
const messageSchema = new Schema(
    {
    message:{
        text:{
            type:String,
            required:true,
        },
    },
    users:Array,
    uuid:String,
    sender:{
        type:Schema.Types.ObjectId,
        ref:"users",
        required:true,
       },
       deletedFor: 
        {
          userId: {
            type: Schema.Types.ObjectId,
          },
          deletedForMe: {
            type: Boolean,
            default: false,
          },
          deletedForEveryone: {
            type: Boolean,
            default: false,
          },
        },
    },

    {
        timestamps:true
    }

)

module.exports = model('Messages',messageSchema)