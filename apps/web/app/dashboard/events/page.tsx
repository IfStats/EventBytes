"use client";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Button,
} from "@/components/ui/button";

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
  getEvents,
  publishEvent,
} from "@/lib/api/events/events";

import {
  useRouter,
} from "next/navigation";


export default function EventsPage() {


const router = useRouter();

const queryClient = useQueryClient();


const {
  organizationId,
  isLoading:userLoading
}=useAuth();



const {
  data,
  isLoading,
  error
}=useQuery({

  queryKey:[
    "events",
    organizationId
  ],


  queryFn:()=>getEvents(
    organizationId!
  ),


  enabled:
    !!organizationId,


});





if(userLoading || isLoading){

 return (

  <div className="p-6">
    Loading events...
  </div>

 );

}





if(error){

 return (

  <div className="p-6 text-red-500">
    Failed loading events
  </div>

 );

}





return (

<div className="p-6">


<div className="flex justify-between mb-6">


<h1 className="text-3xl font-bold">
Events
</h1>



<Button

onClick={()=> 
 router.push(
  "/dashboard/events/create"
 )
}

>

Create Event

</Button>



</div>





<div className="grid gap-6">



{
data?.length ?

data.map((event:any)=>(


<Card key={event.id}>


<CardHeader>


<CardTitle>

{event.name}

</CardTitle>


</CardHeader>





<CardContent className="space-y-3">



<p>

{event.venue || "No venue"}

</p>





<p>

{
new Date(
event.startDate
).toLocaleString()

}

</p>





<p>

Status:

{" "}

{

event.published

?

"Published"

:

"Draft"

}


</p>





<Button

onClick={async()=>{


await publishEvent(

 organizationId!,

 event.id

);



queryClient.invalidateQueries({

 queryKey:[

  "events",

  organizationId

 ]

});


}}

>


{

event.published

?

"Unpublish"

:

"Publish"

}


</Button>





</CardContent>



</Card>



))


:

(

<p>
No events created yet.
</p>

)


}



</div>



</div>

);


}