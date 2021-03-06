"use strict";

// standard setup, present in every test
const test = require("ava");
const Prism = require("./setup.js");

// test specific data
const resource_endpoint = "/self_mailers";
const lobUri = "https://api.lob.com/v1";
const specFile = "./Lob-API-public.yml";

const prism = new Prism(specFile, lobUri, process.env.LOB_API_TEST_TOKEN);

// contract tests happy path
test("create, list, read, then cancel a self mailer", async function (t) {
  t.plan(6);
  // need to put this inside each test set, because it requires t
  const makeAddress = async (address_data) => {
    let response = await prism
      .setup()
      .then((client) =>
        client.post("/addresses", address_data, { headers: prism.authHeader })
      );
    return response.data.id;
  };
  const deleteAddress = async (address_id) => {
    const response = await prism
      .setup()
      .then((client) =>
        client.delete(`/addresses/${address_id}`, { headers: prism.authHeader })
      );
    t.assert(response.status === 200);
    return response;
  };
  const to = await makeAddress({
    company: "Lob (old)",
    address_line1: "185 Berry St",
    address_line2: "# 6100",
    address_city: "San Francisco",
    address_state: "CA",
    address_zip: "94107",
  });
  const from = await makeAddress({
    company: "Lob (new)",
    address_line1: "210 King St",
    address_city: "San Francisco",
    address_state: "CA",
    address_zip: "94107",
    address_country: "US",
  });

  const create = await prism.setup().then((client) =>
    client.post(
      resource_endpoint,
      {
        to: to,
        from: from,
        outside: "<html>Outside HTML</html>",
        inside: "<html>Inside HTML</html>",
      },
      { headers: prism.authHeader }
    )
  );
  // note: existing endpoints return 200 on success. All new endpoints should
  // return 201 ("created")
  t.assert(create.status === 200);

  // read, replace, update and delete created endpoint
  const sfm_endpoint = `${resource_endpoint}/${create.data.id}`;

  const list = await prism
    .setup()
    .then((client) =>
      client.get(resource_endpoint, { headers: prism.authHeader })
    );
  t.assert(list.status === 200);

  const read = await prism
    .setup()
    .then((client) => client.get(sfm_endpoint, { headers: prism.authHeader }));
  t.assert(read.status === 200);

  // Be careful where you get the id! If you just use
  // create.data.id, you could delete the resource before reading it.
  const cancel = await prism.setup().then((client) =>
    client.delete(`${resource_endpoint}/${read.data.id}`, {
      headers: prism.authHeader,
    })
  );
  t.assert(cancel.status === 200);

  await deleteAddress(to);
  await deleteAddress(from);
});

test("create, list, read, then cancel a self mailer with full payload", async function (t) {
  t.plan(6);
  // need to put this inside each test set, because it requires t
  const makeAddress = async (address_data) => {
    let response = await prism
      .setup()
      .then((client) =>
        client.post("/addresses", address_data, { headers: prism.authHeader })
      );
    return response.data.id;
  };
  const deleteAddress = async (address_id) => {
    const response = await prism
      .setup()
      .then((client) =>
        client.delete(`/addresses/${address_id}`, { headers: prism.authHeader })
      );
    t.assert(response.status === 200);
    return response;
  };
  const to = await makeAddress({
    description: "Harry - Old Office",
    name: "Harry Zhang",
    company: "Lob (old)",
    address_line1: "185 Berry St",
    address_line2: "# 6100",
    address_city: "San Francisco",
    address_state: "CA",
    address_zip: "94107",
    address_country: "US",
    phone: "5555555555",
    email: "harry.zhang@lob.com",
  });
  const from = await makeAddress({
    description: "Harry - New Office",
    name: "Harry Zhang",
    company: "Lob (new)",
    address_line1: "210 King St",
    address_city: "San Francisco",
    address_state: "CA",
    address_zip: "94107",
    address_country: "US",
    phone: "5555555555",
    email: "harry.zhang@lob.com",
  });
  const date = new Date();
  date.setDate(date.getDate() + 1); // adding a day to today's date so clearly within 180 days of today

  const create = await prism.setup().then((client) =>
    client.post(
      resource_endpoint,
      {
        description: "Demo Self Mailer Job",
        to: to,
        from: from,
        send_date: date.toISOString(),
        outside: "<html>Outside HTML</html>",
        inside: "<html>Inside HTML</html>",
        size: "6x18_bifold",
        mail_type: "usps_standard",
        merge_variables: { name: "Harry" },
      },
      { headers: prism.authHeader }
    )
  );
  // note: existing endpoints return 200 on success. All new endpoints should
  // return 201 ("created")
  t.assert(create.status === 200);

  // read, replace, update and delete created endpoint
  const sfm_endpoint = `${resource_endpoint}/${create.data.id}`;

  const list = await prism
    .setup()
    .then((client) =>
      client.get(resource_endpoint, { headers: prism.authHeader })
    );
  t.assert(list.status === 200);

  const read = await prism
    .setup()
    .then((client) => client.get(sfm_endpoint, { headers: prism.authHeader }));
  t.assert(read.status === 200);

  // Be careful where you get the id! If you just use
  // create.data.id, you could delete the resource before reading it.
  const cancel = await prism.setup().then((client) =>
    client.delete(`${resource_endpoint}/${read.data.id}`, {
      headers: prism.authHeader,
    })
  );
  t.assert(cancel.status === 200);

  await deleteAddress(to);
  await deleteAddress(from);
});

// add any failure cases you need here
