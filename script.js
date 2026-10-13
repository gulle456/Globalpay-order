
const products = [
  { id: 1, name: "Laptop", price: 699, emoji: "💻" },
  { id: 2, name: "Smartphone", price: 429, emoji: "📱" },
  { id: 3, name: "Headphones", price: 89, emoji: "🎧" },
  { id: 4, name: "Smart Watch", price: 149, emoji: "⌚" },
  { id: 5, name: "Backpack", price: 59, emoji: "🎒" },
  { id: 6, name: "Running Shoes", price: 79, emoji: "👟" },
  { id: 7, name: "Camera", price: 529, emoji: "📷" },
  { id: 8, name: "Desk Lamp", price: 35, emoji: "💡" }
];

const $ = id => document.getElementById(id);

let cart = JSON.parse(localStorage.getItem("gsCart") || "[]");
let orders = JSON.parse(localStorage.getItem("gsOrders") || "[]");

function saveData() {
  localStorage.setItem("gsCart", JSON.stringify(cart));
  localStorage.setItem("gsOrders", JSON.stringify(orders));
}

function money(amount) {
  return "$" + Number(amount).toFixed(2);
}

function notify(message) {
  $("message").textContent = message;
  $("message").style.display = "block";

  setTimeout(() => {
    $("message").style.display = "none";
  }, 3000);
}

function renderProducts() {
  const search = $("search").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search)
  );

  $("products").innerHTML = filtered.map(product => `
    <article class="product">
      <div class="product-art">${product.emoji}</div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>Available for worldwide ordering.</p>
        <div class="price">${money(product.price)}</div>
        <button class="btn" data-add="${product.id}">
          Add to Cart
        </button>
      </div>
    </article>
  `).join("") || "<p>No products found.</p>";
}

function renderCart() {
  $("count").textContent =
    cart.reduce((sum, item) => sum + item.qty, 0);

  const total = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + product.price * item.qty;
  }, 0);

  $("total").textContent = money(total);
  $("checkoutTotal").textContent = money(total);

  if (!cart.length) {
    $("cartItems").textContent = "Your cart is empty.";
  } else {
    $("cartItems").innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.id);

      return `
        <div class="cart-row">
          <div>
            <strong>${product.emoji} ${product.name}</strong>
            <p>${money(product.price)} each</p>
            <p>Quantity: ${item.qty}</p>
          </div>
          <div>
            <strong>${money(product.price * item.qty)}</strong><br>
            <button data-change="${item.id}" data-delta="-1">−</button>
            <button data-change="${item.id}" data-delta="1">+</button>
            <button data-remove="${item.id}">Remove</button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderDashboard();
}

function renderDashboard() {
  $("orderCount").textContent = orders.length;

  $("pendingCount").textContent = orders.filter(order =>
    ["Pending", "Processing"].includes(order.status)
  ).length;

  const revenue = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  $("revenue").textContent = money(revenue);

  if (!orders.length) {
    $("ordersTable").innerHTML =
      '<tr><td colspan="6">No orders have been placed.</td></tr>';
    return;
  }

  $("ordersTable").innerHTML = [...orders].reverse().map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${escapeHTML(order.name)}</td>
      <td>${escapeHTML(order.country)}</td>
      <td>${money(order.total)}</td>
      <td>${escapeHTML(order.payment)}</td>
      <td>
        <span class="status">${order.status}</span>
        <br>
        <select data-status="${order.id}" aria-label="Update order status">
          ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
            .map(status => `
              <option ${status === order.status ? "selected" : ""}>
                ${status}
              </option>
            `).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Add products to the cart
$("products").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  const id = Number(button.dataset.add);
  const item = cart.find(item => item.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveData();
  renderCart();
  notify("Product added to cart.");
});

// Increase or decrease quantity and remove items
$("cartItems").addEventListener("click", event => {
  const change = event.target.closest("[data-change]");
  const remove = event.target.closest("[data-remove]");

  if (change) {
    const id = Number(change.dataset.change);
    const item = cart.find(item => item.id === id);

    if (item) {
      item.qty += Number(change.dataset.delta);
      if (item.qty <= 0) {
        cart = cart.filter(item => item.id !== id);
      }
    }
  }

  if (remove) {
    const id = Number(remove.dataset.remove);
    cart = cart.filter(item => item.id !== id);
  }

  saveData();
  renderCart();
});

$("search").addEventListener("input", renderProducts);

$("openCart").addEventListener("click", () => {
  $("cart").scrollIntoView({ behavior: "smooth" });
});

// Open checkout
$("checkout").addEventListener("click", () => {
  if (!cart.length) {
    notify("Please add products to your cart first.");
    return;
  }

  $("checkoutTotal").textContent = $("total").textContent;
  $("checkoutModal").classList.remove("hidden");
});

$("closeModal").addEventListener("click", () => {
  $("checkoutModal").classList.add("hidden");
});

// Create a demonstration order
$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!cart.length) {
    notify("Your cart is empty.");
    return;
  }

  const form = new FormData(event.target);

  const total = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + product.price * item.qty;
  }, 0);

  const order = {
    id: "GS-" + Date.now().toString().slice(-8),
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone"),
    country: form.get("country"),
    address: form.get("address"),
    payment: form.get("payment"),
    total: total,
    items: cart.map(item => ({ ...item })),
    status: "Pending",
    date: new Date().toLocaleDateString()
  };

  orders.push(order);
  cart = [];

  saveData();
  renderCart();

  $("checkoutModal").classList.add("hidden");
  event.target.reset();

  $("orderNumber").value = order.id;
  $("tracking").innerHTML = `
    <div class="cart-row">
      <div>
        <h3>Demo Order Created Successfully!</h3>
        <p>Order number: <strong>${order.id}</strong></p>
        <p>Status: Pending</p>
        <p>No real payment has been processed.</p>
      </div>
    </div>
  `;

  notify("Order created. Save your order number.");
  $("track").scrollIntoView({ behavior: "smooth" });
});

// Track an order
$("trackForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("orderNumber").value.trim().toUpperCase();
  const order = orders.find(
    order => order.id.toUpperCase() === id
  );

  if (!order) {
    $("tracking").innerHTML =
      "<p>Order not found. Check the order number.</p>";
    return;
  }

  $("tracking").innerHTML = `
    <div class="cart-row">
      <div>
        <h3>Order ${order.id}</h3>
        <p>Customer: ${escapeHTML(order.name)}</p>
        <p>Destination: ${escapeHTML(order.country)}</p>
        <p>Total: ${money(order.total)}</p>
        <p>Payment method: ${escapeHTML(order.payment)}</p>
        <p>Current status: <strong>${order.status}</strong></p>
        <p>Order date: ${order.date}</p>
        <small>Demo tracking only; no live courier connection.</small>
      </div>
    </div>
  `;
});

// Update order status from the dashboard
$("ordersTable").addEventListener("change", event => {
  const id = event.target.dataset.status;
  if (!id) return;

  const order = orders.find(order => order.id === id);
  if (!order) return;

  order.status = event.target.value;

  saveData();
  renderDashboard();
  notify("Order status updated.");
});

// Export order records to CSV
$("export").addEventListener("click", () => {
  if (!orders.length) {
    notify("There are no orders to export.");
    return;
  }

  const headings = [
    "Order ID", "Customer", "Email", "Phone",
    "Country", "Address", "Total USD", "Payment", "Status"
  ];

  const rows = orders.map(order => [
    order.id, order.name, order.email, order.phone,
    order.country, order.address, order.total.toFixed(2),
    order.payment, order.status
  ]);

  const csv = [headings, ...rows].map(row =>
    row.map(value =>
      '"' + String(value).replace(/"/g, '""') + '"'
    ).join(",")
  ).join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "globalshop-orders.csv";
  link.click();

  URL.revokeObjectURL(url);
  notify("Orders CSV exported.");
});

// Initial display
renderProducts();
renderCart();
