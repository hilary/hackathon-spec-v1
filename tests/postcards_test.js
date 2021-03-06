"use strict";

// standard setup, present in every test
const test = require("ava");
const fs = require("fs");
const path = require("path");
const Prism = require("./setup.js");

// test specific data
const resource_endpoint = "/postcards",
  lobUri = "https://api.lob.com/v1",
  specFile = "./Lob-API-public.yml";

const prism = new Prism(specFile, lobUri, process.env.LOB_API_TEST_TOKEN);

// contract tests happy path
test("create, list, read then cancel a postcard", async function (t) {
  t.plan(6);
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
    phone: "5555555555",
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
        front:
          "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/4x6_pc_template.pdf",
        back: "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/4x6_pc_template.pdf",
      },
      { headers: prism.authHeader }
    )
  );
  t.assert(create.status === 200);

  const list = await prism
    .setup()
    .then((client) =>
      client.get(resource_endpoint, { headers: prism.authHeader })
    );
  t.assert(list.status === 200);

  const read = await prism.setup().then((client) =>
    client.get(`${resource_endpoint}/${create.data.id}`, {
      headers: prism.authHeader,
    })
  );
  t.assert(read.status === 200);

  const cancel = await prism.setup().then((client) =>
    client.delete(`${resource_endpoint}/${read.data.id}`, {
      headers: prism.authHeader,
    })
  );
  t.assert(cancel.status === 200);

  await deleteAddress(to);
  await deleteAddress(from);
});

test("create, list, read then cancel a postcard with full payload", async function (t) {
  t.plan(6);
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
        description: "Demo Postcard",
        to: to,
        from: from,
        send_date: date.toISOString(),
        front:
          "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/6x11_pc_template.pdf",
        back: "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/6x11_pc_template.pdf",
        size: "6x11",
        mail_type: "usps_standard",
        merge_variables: { name: "Harry" },
      },
      { headers: prism.authHeader }
    )
  );
  t.assert(create.status === 200);

  const list = await prism
    .setup()
    .then((client) =>
      client.get(resource_endpoint, { headers: prism.authHeader })
    );
  t.assert(list.status === 200);

  const read = await prism.setup().then((client) =>
    client.get(`${resource_endpoint}/${create.data.id}`, {
      headers: prism.authHeader,
    })
  );
  t.assert(read.status === 200);

  const cancel = await prism.setup().then((client) =>
    client.delete(`${resource_endpoint}/${read.data.id}`, {
      headers: prism.authHeader,
    })
  );
  t.assert(cancel.status === 200);

  await deleteAddress(to);
  await deleteAddress(from);
});

test("creates a postcard given a local filepath as the front", async function (t) {
  t.plan(1);
  function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  }

  const files = fs.createReadStream(
    path.resolve(
      "tests/assets/customer-thank-you-postcard-template-4x6-front.html"
    )
  );
  const frontBack = await streamToString(files);

  const create = await prism.setup().then((client) =>
    client.post(
      resource_endpoint,
      {
        to: {
          company: "Lob (old)",
          address_line1: "185 Berry St",
          address_line2: "# 6100",
          address_city: "San Francisco",
          address_state: "CA",
          address_zip: "94107",
        },
        from: {
          company: "Lob (new)",
          address_line1: "210 King St",
          address_city: "San Francisco",
          address_state: "CA",
          address_zip: "94107",
          address_country: "US",
        },
        front: frontBack,
        back: frontBack,
      },
      { headers: prism.authHeader }
    )
  );
  t.assert(create.status === 200);
});

// select failure cases:
test("throws errors when input is not validated", async function (t) {
  t.plan(2);
  // errors when one of the required fields (state) is missing
  const create_domestic = await prism.setup({ errors: false }).then((client) =>
    client.post(
      resource_endpoint,
      {
        to: {
          company: "Lob (old)",
          address_line1: "185 Berry St",
          address_line2: "# 6100",
          address_city: "San Francisco",
          address_zip: "94107",
        },
        from: {
          company: "Lob (new)",
          address_line1: "210 King St",
          address_city: "San Francisco",
          address_state: "CA",
          address_zip: "94107",
          address_country: "US",
        },
        front:
          "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/4x6_pc_template.pdf",
        back: "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/4x6_pc_template.pdf",
      },
      { headers: prism.authHeader }
    )
  );
  t.assert(create_domestic.status === 422);

  // errors when no country is provided for international address
  const create_intl = await prism.setup({ errors: false }).then((client) =>
    client.post(
      resource_endpoint,
      {
        to: {
          company: "Lobster House",
          address_line1: "370 Water St",
          address_city: "Summerside",
          address_state: "Prince Edward Island",
          address_zip: "C1N 1C4",
        },
        from: {
          company: "Lob (new)",
          address_line1: "210 King St",
          address_city: "San Francisco",
          address_state: "CA",
          address_zip: "94107",
          address_country: "US",
        },
        front:
          "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/4x6_pc_template.pdf",
        back: "https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/4x6_pc_template.pdf",
      },
      { headers: prism.authHeader }
    )
  );
  t.assert(create_intl.status === 422);
});
