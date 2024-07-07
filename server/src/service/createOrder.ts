import { Page, firefox } from "playwright";
import { fetchDesiredRestaurantOrMeal } from "../api/openai";
import {
  ConfirmOrder,
  EOrderStatus,
  Meal,
  Order,
  OrderStatus,
  Restaurant,
} from "../types";

const DEFAULT_TIMEOUT = 12000;

const delay = (from: number, to: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (to - from) + from)
  );

const loginToGoogleAccount = async (page: Page) => {
  // Wait for and fill email
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', process.env.WOLT_EMAIL || "");
  await Promise.all([page.waitForNavigation(), page.click("#identifierNext")]);

  // Wait for and fill password
  await page.waitForSelector('input[type="password"]', { state: "visible" });
  await page.type(
    'input[type="password"]',
    process.env.WOLT_EMAIL_PASSWORD || ""
  );

  // Click the password next button and wait for navigation
  await Promise.all([page.waitForNavigation(), page.click("#passwordNext")]);

  // Wait for redirect back to Wolt
  await page.waitForFunction(
    () => {
      return window.location.href.includes("wolt.com");
    },
    { timeout: 30000 }
  );

  // Wait for a Wolt-specific element to ensure the page has loaded
  await page.waitForSelector('button[data-test-id="UserStatusDropdown"]', {
    state: "visible",
    timeout: 30000,
  });
};

const checkWoltCookiesBanner = async (page: Page) => {
  const overlay = await page.$(".ConsentsBannerOverlay");
  if (overlay) {
    const acceptButton = await overlay.$(
      "button[data-localization-key='gdpr-consents.banner.accept-button']"
    );
    if (!acceptButton) {
      return;
    }
    await acceptButton.click();
  }
};

const loginToWoltAccountIfNecessary = async (page: Page) => {
  // Navigate to the Wolt discovery page
  await page.goto("https://wolt.com/en/discovery");

  // Wait for the page to load
  await page.waitForURL("https://wolt.com/en/discovery", {
    waitUntil: "domcontentloaded",
  });

  // Delay to ensure the cookie consent banner is rendered
  await delay(1700, 1800);

  // Handle the cookie consent banner if present
  await checkWoltCookiesBanner(page);

  // Check if the user is already logged in
  const isLoggedInIcon = await page.$(
    "button[data-test-id='UserStatusDropdown']"
  );

  // User is already logged in, exit the function
  if (isLoggedInIcon) {
    return;
  }

  // Find and click the login button
  const loginButton = await page.getByRole("button", { name: "Log in" });
  if (!loginButton) {
    return; // Login button not found, exit the function
  }
  await loginButton.click();

  // Wait for the login modal to appear
  await page.waitForSelector('div[data-test-id="modal-background"]');

  // Find and click the "Continue with Google" button
  const continueWithGoogleButton = page.getByText("Continue with Google");
  await continueWithGoogleButton.click();

  // Perform Google account login
  await loginToGoogleAccount(page);
};

const fetchRestaurants = async (page: Page): Promise<Restaurant[]> => {
  // Find all restaurant elements on the page
  const restaurantList = await page.$$("div.cb-elevated");

  // Map each restaurant element to a Restaurant object
  return await Promise.all(
    restaurantList.map(async (el, i) => {
      return {
        id: i, // Assign an ID based on the index
        ...(await el.evaluate((restaurant) => {
          return {
            name: (restaurant as any).querySelector("h3")?.textContent, // Extract restaurant name
            url: (restaurant as any).querySelector("a")?.href, // Extract restaurant URL
            isOpened: Array.from(
              (restaurant as any).querySelectorAll("div")
            ).find((el) => (el as any).innerText === "min")
              ? true
              : false, // Check if restaurant is open based on the presence of "min" text
          };
        })),
        element: el, // Store the ElementHandle for future use
      };
    })
  );
};

const goToRestaurants = async (page: Page, restaurant: string) => {
  // Navigate to the Wolt restaurants discovery page
  await page.goto("https://wolt.com/en/discovery/restaurants");

  // Wait for the page to fully load
  await page.waitForURL("https://wolt.com/en/discovery/restaurants", {
    waitUntil: "networkidle",
    timeout: DEFAULT_TIMEOUT,
  });

  // Fetch all restaurants from the page
  const allRestaurants = await fetchRestaurants(page);

  // Filter out closed restaurants
  const availableRestaurants = allRestaurants.filter((r) => r.isOpened);

  // Use AI to select the desired restaurant based on the input
  const selectedRestaurantIdUnparsed = await fetchDesiredRestaurantOrMeal(
    JSON.stringify(
      availableRestaurants.map((m) => ({ id: m.id, name: m.name }))
    ),
    restaurant
  );

  // If no restaurant was selected, return early
  if (!selectedRestaurantIdUnparsed) return;

  // Parse the selected restaurant ID
  const selectedRestaurantId = JSON.parse(selectedRestaurantIdUnparsed)?.id;

  // Find the selected restaurant in the list of all restaurants
  const selectedRestaurant = allRestaurants.find(
    (m) => m.id === selectedRestaurantId
  );

  // If the selected restaurant wasn't found, return early
  if (!selectedRestaurant) return;

  // Navigate to the selected restaurant's page
  await page.goto(selectedRestaurant.url);

  // Wait for the restaurant page to fully load
  await page.waitForURL(selectedRestaurant.url, {
    waitUntil: "networkidle",
    timeout: DEFAULT_TIMEOUT,
  });

  // Return true to indicate successful navigation to the restaurant
  return true;
};

const fetchMeals = async (page: Page): Promise<Meal[]> => {
  // Find all meal cards on the page
  const allMealsCards = await page.$$(
    "div[data-test-id='horizontal-item-card']"
  );

  // Map each meal card to a Meal object
  return await Promise.all(
    allMealsCards.map(async (el, i) => {
      return {
        // Extract meal name from the card
        ...(await el.evaluate((restaurant) => {
          return {
            name: (restaurant as any)
              .querySelector("h3")
              ?.textContent?.toLowerCase(),
          };
        })),
        element: el, // Store the ElementHandle for future use
        id: i, // Assign an ID based on the index
      };
    })
  );
};

const getMeal = async (page: Page, meal: string) => {
  try {
    // Wait for the page to be fully loaded and network to be idle
    await page.waitForLoadState("networkidle");

    // Wait for images to be visible
    await page.waitForSelector("div[data-test-id='horizontal-item-card']", {
      state: "visible",
    });

    // Fetch all meals from the page
    const allMeals: Meal[] = await fetchMeals(page);

    // Use AI to select the desired meal based on the input
    const selectedMealIdUnparsed = await fetchDesiredRestaurantOrMeal(
      JSON.stringify(allMeals.map((m) => ({ id: m.id, name: m.name }))),
      meal
    );

    // If no meal was selected, return early
    if (!selectedMealIdUnparsed) return;

    // Parse the selected meal ID
    const selectedMealId = JSON.parse(selectedMealIdUnparsed)?.id;

    // Find the selected meal in the list of all meals
    const selectedMeal = allMeals.find((m) => m.id === selectedMealId);

    // If the selected meal wasn't found, return early
    if (!selectedMeal) return;

    // Take a screenshot of the selected meal
    const mealImageBuffer = await selectedMeal.element.screenshot({
      type: "png",
    });

    // Return the meal information
    return {
      id: selectedMeal.id,
      mealImage: mealImageBuffer.toString("base64"),
      pageUrl: page.url(),
    };
  } catch (error) {
    // Log any errors that occur during the process
    console.error("Error in getMeal:", error);
  }
};

export const createOrder = async (order: Order): Promise<ConfirmOrder> => {
  // Initialize a persistent Firefox browser context
  const browser = await firefox.launchPersistentContext("./tmp", {
    headless: false,
    args: ["--disable-dev-shm-usage"],
    viewport: {
      width: 1250,
      height: 1440,
    },
  });

  try {
    // Create a new page in the browser
    const page = await browser.newPage();

    // Disable navigation timeout
    await page.setDefaultNavigationTimeout(0);

    // Ensure user is logged into Wolt
    await loginToWoltAccountIfNecessary(page);

    // Extract order details
    const { meal, restaurant } = order;

    // Navigate to the restaurants page and find the specified restaurant
    const found = await goToRestaurants(page, restaurant);
    if (!found) throw new Error("Restaurant not found");

    // Find and select the specified meal
    const confirmOrder = await getMeal(page, meal);
    if (!confirmOrder) throw new Error("Meal not found");

    // Return the confirmation details of the selected meal
    return confirmOrder;
  } catch (err) {
    // Handle any errors that occur during the order creation process
    return {
      id: null,
      mealImage: "",
      pageUrl: "",
      error: (err as Error).message as string,
    };
  } finally {
    // Ensure the browser is closed, even if an error occurred
    await browser.close();
  }
};

const addMealToCart = async (page: Page, pageUrl: string, mealId: number) => {
  // Navigate to the restaurant page
  await page.goto(pageUrl);

  // Wait for the page to load
  await page.waitForLoadState("networkidle");

  // Wait for a key element that indicates the page is fully rendered
  await page.waitForSelector("div[data-test-id='horizontal-item-card']", {
    state: "visible",
    timeout: 10000,
  });

  // Fetch all meals and find the selected one
  const allMeals: Meal[] = await fetchMeals(page);
  const selectedMeal = allMeals.find((m) => m.id === mealId);
  if (!selectedMeal) throw new Error("Meal not found");

  // Find and click the meal image to open the modal
  const popupImg = await selectedMeal.element.$("img");
  if (!popupImg) throw new Error("Meal image not found");
  await popupImg.click();

  // Wait for the modal to open and the "Add to cart" button to be visible
  await page.waitForSelector("button[data-test-id='product-modal.submit']", {
    state: "visible",
    timeout: 5000,
  });

  // Click the "Add to cart" button
  await page.click("button[data-test-id='product-modal.submit']");

  // Wait for the cart to update
  await page.waitForSelector("button[data-test-id='cart-view-button']", {
    state: "visible",
    timeout: 5000,
  });
};

export const orderFood = async (order: ConfirmOrder): Promise<OrderStatus> => {
  // Initialize a persistent Firefox browser context
  const browser = await firefox.launchPersistentContext("./tmp", {
    headless: false,
    args: ["--disable-dev-shm-usage"],
    viewport: {
      width: 1250,
      height: 1440,
    },
  });

  try {
    // Create a new page in the browser
    const page = await browser.newPage();

    // Disable navigation timeout
    await page.setDefaultNavigationTimeout(0);

    // Ensure user is logged into Wolt
    await loginToWoltAccountIfNecessary(page);

    // Extract order details
    const { id, pageUrl } = order;
    if (!id || !pageUrl) throw new Error("No id or pageUrl provided");

    // Add the selected meal to the cart
    await addMealToCart(page, pageUrl, id);

    // Proceed to checkout and place the order
    const orderStatus = await goToCheckout(page, pageUrl);

    return orderStatus;
  } catch (err) {
    // Handle any errors that occur during the ordering process
    return {
      status: EOrderStatus.ERROR,
      message: "Order not placed",
      waitingTime: "",
      error: (err as Error).message,
    };
  } finally {
    // Ensure the browser is closed, even if an error occurred
    await browser.close();
  }
};

const goToCheckout = async (page: Page, pageUrl: string) => {
  // Navigate to the checkout page
  await page.goto(pageUrl + "/checkout");

  // Wait for the URL to be fully loaded, with network activity idle
  await page.waitForURL(pageUrl + "/checkout", {
    waitUntil: "networkidle",
    timeout: DEFAULT_TIMEOUT,
  });

  // Select the checkout button using the data-test-id attribute
  const checkoutButton = await page.$(
    "button[data-test-id='BackendPricing.SendOrderButton']"
  );

  // Throw an error if the checkout button is not found
  if (!checkoutButton) throw new Error("Checkout button not found");

  // Click the checkout button to place the order
  await checkoutButton!.click();

  // Wait for the order status element to appear on the page
  await page.waitForSelector("div[data-test-id='OrderStatus']", {
    timeout: DEFAULT_TIMEOUT,
  });

  // Select the order status element
  const orderStatus = await page.$("div[data-test-id='OrderStatus']");

  // Get the text content of the first child of the order status element
  const firstChild = await orderStatus?.evaluate(
    (el) => el.firstChild?.textContent
  );

  // Return the order status information
  return {
    status: EOrderStatus.CONFIRMED,
    message: "Order placed",
    waitingTime: firstChild || "",
  };
};
