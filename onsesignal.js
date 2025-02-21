export const getUserLocation = async (isInside) => {
  try {
    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Key os_v2_app_dqy4svzncff3zgiwbt2bau6nvi6fykbz4ssupn5zvzkbllkwsjntdbtpk5bogzbsf4u3kvovcbwol6xgkzjvgpoz466u7ltpc5ac4sq`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          app_id: '1c31c957-2d11-4bbc-9916-0cf41053cdaa',
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
      throw new Error(response.status)
    }
    const json = await response.json()
    console.log(json)
    return json
  } catch (error) {
    console.error(error);
    throw new Error(error);
    
  }
};