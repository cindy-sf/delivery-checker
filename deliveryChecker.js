const formatDeliveries = (deliveries) => {
  return deliveries.reduce((acc, [pickup, dropoff]) => {
    acc[pickup] = { related: dropoff, type: "pickup" };
    acc[dropoff] = { related: pickup, type: "dropoff" };
    return acc;
  }, {});
};

const checkDelivery = (deliveries, path) => {
  const formattedDeliveries = formatDeliveries(deliveries);
  const totalAddresses = Object.keys(formattedDeliveries).length;
  const steps = [];
  const visitedAddresses = new Set();

  if (totalAddresses > path.length) {
    const missingAddresses = Object.keys(formattedDeliveries).filter(
      (address) => !path.includes(parseInt(address))
    );

    return {
      status: "error",
      error_code: "delivery_address_not_in_path",
      error_message: `Addresses: '${missingAddresses.join(", ")}' are required in the path`,
    };
  }

  for (let i = 0; i < path.length; i++) {
    const currentPath = path[i];
    const currentDelivery = formattedDeliveries[currentPath];

    if (!currentDelivery) {
      steps.push({
        address: currentPath,
        action: null,
      });
      continue;
    }

    const hasDeliveryDropoffBeforePickup =
      currentDelivery.type === "dropoff" &&
      !visitedAddresses.has(currentDelivery.related);

    if (hasDeliveryDropoffBeforePickup) {
      return {
        status: "error",
        error_code: "delivery_dropoff_before_pickup",
        error_message: `Cannot dropoff '${currentPath}' before picking up '${currentDelivery.related}'`,
      };
    }

    steps.push({
      address: currentPath,
      action: currentDelivery.type,
    });

    visitedAddresses.add(currentPath);
  }

  return {
    status: "success",
    steps,
  };
};

const args = process.argv.slice(2);
const deliveries = JSON.parse(args[0]);
const path = JSON.parse(args[1]);

const result = checkDelivery(deliveries, path);
console.log(JSON.stringify(result));
