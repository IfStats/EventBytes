"use client";

import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";

import {
  useParams,
  useRouter,
} from "next/navigation";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import {
  Button,
} from "@/components/ui/button";


import {
  Badge,
} from "@/components/ui/badge";


import {
  useAuth,
} from "@/context/auth-context";


import {
  getEvent,
  publishEvent,
} from "@/lib/api/events/events";



export default function EventDetailsPage(){


  const params = useParams();

  const router = useRouter();


  const eventId =
    params.eventId as string;



  const {
    organizationId,
    isLoading:userLoading,
  } = useAuth();





  const {
    data:event,
    isLoading,
    error,
    refetch,
  } = useQuery({

    queryKey:[
      "event",
      organizationId,
      eventId,
    ],


    queryFn:()=>getEvent(
      organizationId!,
      eventId
    ),


    enabled:
      !!organizationId &&
      !!eventId,

  });






  const publishMutation =
    useMutation({

      mutationFn:()=>publishEvent(
        organizationId!,
        eventId
      ),


      onSuccess:()=>{

        refetch();

      }

    });






  if(
    userLoading ||
    isLoading
  ){

    return (
      <div className="p-8">
        Loading event...
      </div>
    );

  }





  if(error){

    return (

      <div className="p-8 text-red-500">

        Failed loading event

      </div>

    );

  }





  if(!event){

    return (

      <div className="p-8">

        Event not found

      </div>

    );

  }





  return (

    <div className="p-8 space-y-6">



      <div className="flex justify-between items-center">


        <div>

          <h1 className="text-3xl font-bold">

            {event.name}

          </h1>


          <p className="text-muted-foreground">

            {event.organization.name}

          </p>


        </div>



        <Badge>

          {event.status}

        </Badge>


      </div>







      <Card>

        <CardHeader>

          <CardTitle>
            Event Information
          </CardTitle>

        </CardHeader>



        <CardContent className="space-y-2">


          <p>
            Venue:
            {" "}
            {event.venue}
          </p>



          <p>
            Start:
            {" "}
            {
              new Date(
                event.startDate
              ).toLocaleString()
            }
          </p>



          <p>
            End:
            {" "}
            {
              new Date(
                event.endDate
              ).toLocaleString()
            }
          </p>



          <p>
            Description:
            {" "}
            {event.description}
          </p>


        </CardContent>


      </Card>









      <Card>


        <CardHeader className="flex flex-row justify-between">


          <CardTitle>
            Ticket Categories
          </CardTitle>



          <Button
            onClick={()=>router.push(
              `/dashboard/events/${eventId}/tickets/create`
            )}
          >

            Create Ticket

          </Button>


        </CardHeader>





        <CardContent>


          {
            event.ticketCategories.length
            ?
            event.ticketCategories.map(
              (ticket:any)=>(

                <div
                  key={ticket.id}
                  className="border-b py-3 flex justify-between"
                >

                  <div>

                    <p className="font-medium">
                      {ticket.name}
                    </p>


                    <p className="text-sm text-muted-foreground">

                      Quantity:
                      {" "}
                      {ticket.quantity}

                    </p>

                  </div>



                  <p>

                    ${ticket.price}

                  </p>


                </div>

              )
            )

            :

            <p>
              No ticket categories yet.
            </p>

          }


        </CardContent>


      </Card>







      <div className="flex gap-4">


        <Button

          disabled={
            publishMutation.isPending
          }


          onClick={()=>
            publishMutation.mutate()
          }

        >

          {
            event.published
            ?
            "Unpublish Event"
            :
            "Publish Event"
          }


        </Button>





        <Button
          variant="outline"
          onClick={()=>
            router.push(
              `/dashboard/events/${eventId}/attendees`
            )
          }
        >

          View Attendees

        </Button>



      </div>



    </div>

  );

}