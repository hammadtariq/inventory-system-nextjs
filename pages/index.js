import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3000/api/cheques/count"),
      fetch("http://localhost:3000/api/company/count"),
      fetch("http://localhost:3000/api/customer/count"),
      fetch("http://localhost:3000/api/inventory/count"),
    ])
      .then(function (responses) {
        // Get a JSON object from each of the responses
        console.log("responses", responses);
        return Promise.all(
          responses.map(function (response) {
            return response.json();
          })
        );
      })
      .then(function (data) {
        // Log the data to the console
        // You would do something with both sets of data here
        console.log(data);
      })
      .catch(function (error) {
        // if there's an error, log it
        console.log(error);
      });
  }, []);

  return <h1>Dashboard works</h1>;
}
