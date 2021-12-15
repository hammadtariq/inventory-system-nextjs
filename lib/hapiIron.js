import Iron from "@hapi/iron";

export const seal = async (value, secret) => {
  if (!value || !secret) {
    throw new Error("Value and secrete required");
  }

  try {
    const sealed = await Iron.seal(value, secret, Iron.defaults);
    return sealed;
  } catch (error) {
    console.log(error);
  }
};

export const unSeal = async (sealed, secret) => {
  if (!sealed || !secret) {
    throw new Error("Sealed and secrete required");
  }

  try {
    const unsealed = await Iron.unseal(sealed, secret, Iron.defaults);
    return unsealed;
  } catch (error) {
    console.log(error);
  }
};
