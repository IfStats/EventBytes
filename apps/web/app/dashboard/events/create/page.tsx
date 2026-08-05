"use client";


import {
  useState,
} from "react";


import {
  useRouter,
} from "next/navigation";


import {
  useMutation,
} from "@tanstack/react-query";


import {
  Button,
} from "@/components/ui/button";


import {
  Input,
} from "@/components/ui/input";


import {
  Textarea,
} from "@/components/ui/textarea";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import {
  useAuth,
} from "@/context/auth-context";


import {
  createEvent,
} from "@/lib/api/events/events";




export default function CreateEventPage(){


const router = useRouter();


const {
 organizationId
}=useAuth();



const [form,setForm]=useState({

 name:"",
 description:"",
 venue:"",
 startDate:"",
 endDate:"",

});





const mutation = useMutation({

 mutationFn:()=>{

   return createEvent(
     organizationId!,
     form
   );

 },


 onSuccess:()=>{

   router.push(
    "/dashboard/events"
   );

 }

});





function update(
 field:string,
 value:string
){

 setForm({

  ...form,

  [field]:value

 });

}






return (

<div className="p-8">


<Card className="max-w-xl">


<CardHeader>

<CardTitle>
Create Event
</CardTitle>

</CardHeader>



<CardContent className="space-y-4">



<Input

placeholder="Event name"

value={form.name}

onChange={
e=>update(
"name",
e.target.value
)
}

/>



<Textarea

placeholder="Description"

value={form.description}

onChange={
e=>update(
"description",
e.target.value
)
}

/>



<Input

placeholder="Venue"

value={form.venue}

onChange={
e=>update(
"venue",
e.target.value
)
}

/>



<div>

<label>
Start Date
</label>


<Input

type="datetime-local"

value={form.startDate}

onChange={
e=>update(
"startDate",
e.target.value
)
}

/>

</div>





<div>

<label>
End Date
</label>


<Input

type="datetime-local"

value={form.endDate}

onChange={
e=>update(
"endDate",
e.target.value
)
}

/>

</div>





<Button

<Button

disabled={
mutation.isPending ||
!organizationId ||
!form.name ||
!form.startDate ||
!form.endDate
}

onClick={()=>mutation.mutate()}

>

{
mutation.isPending
?
"Creating..."
:
"Create Event"
}


</Button>



{
mutation.error && (

<p className="text-red-500">
Failed creating event
</p>

)

}



</CardContent>


</Card>


</div>

)

}