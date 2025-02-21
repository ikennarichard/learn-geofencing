export const sendPushNotification = async (isInside: boolean) => {
  try {
    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Key ${process.env.EXPO_PUBLIC_ONESIGNAL_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          app_id: `${process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID}`,
          headings: {en: 'MPC'},
          contents: {
            en: `${
              isInside
                ? "Your inside the geofence"
                : "Your outside the geofence"
            }`,
          },
          included_segments: ["Active Subscriptions"],
          isAndroid: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(response.statusText)
    }
    const json = await response.json()
    console.log(json)
    return json
  } catch (error) {
    console.error(error);
    if(error instanceof Error) {
      throw new Error(error.message);
    }
    
    
  }
};