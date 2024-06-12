pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract TokenExchange {
    struct Order {
        address tokenAddress;
        uint256 amount;
        uint256 price;
        address maker;
        bool isBuyOrder;
    }

    mapping(address => mapping(uint256 => Order)) public orders;
    mapping(address => uint256) public nextOrderId;

    event OrderCreated(address indexed token, uint256 indexed orderId, uint256 amount, uint256 price, address indexed maker, bool isBuyOrder);
    event OrderExecuted(address indexed token, uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 price);
    event WithdrawToken(address token, uint256 amount);

    function createMultipleOrders(
        address[] calldata tokenAddresses, 
        uint256[] calldata amounts, 
        uint256[] calldata prices, 
        bool[] calldata isBuyOrders
    ) external {
        require(tokenAddresses.length == amounts.length && amounts.length == prices.length && prices.length == isBuyOrders.length, "Data mismatch");
        
        for (uint i = 0; i < tokenAddresses.length; i++) {
            createOrder(tokenAddresses[i], amounts[i], prices[i], isBuyOrders[i]);
        }
    }

    function createOrder(
        address tokenAddress, 
        uint256 amount, 
        uint256 price, 
        bool isBuyOrder
    ) internal { // changed to internal
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");
        uint256 orderId = nextOrderId[tokenAddress]++;
        orders[tokenAddress][orderId] = Order(tokenAddress, amount, price, msg.sender, isBuyOrder);
        emit OrderCreated(tokenAddress, orderId, amount, price, msg.sender, isBuyOrder);
    }

    function executeOrder(address tokenAddress, uint256 orderId) internal { // Optimized into an internal function
        Order storage order = orders[tokenAddress][orderId];
        require(order.maker != address(0), "Order does not exist");
        require(order.isBuyOrder || msg.value == order.amount * order.price, "Incorrect ETH amount");

        if (order.isBuyOrder) {
            require(IERC20(tokenAddress).transferFrom(msg.sender, order.maker, order.amount), "Token transfer failed");
            payable(msg.sender).transfer(order.amount * order.price);
        } else {
            payable(order.maker).transfer(msg.value);
            require(IERC20(tokenAddress).transferFrom(order.maker, msg.sender, order.amount), "Token transfer failed");
        }
        emit OrderExecuted(tokenAddress, orderId, msg.sender, order.amount, order.price);
        delete orders[tokenAddress][orderId];
    }

    // New function to execute multiple orders
    function executeMultipleOrders(address[] calldata tokenAddresses, uint256[] calldata orderIds) external payable {
        require(tokenAddresses.length == orderIds.length, "Data mismatch");
        for (uint i = 0; i < tokenAddresses.length; i++) {
            executeOrder(tokenAddresses[i], orderIds[i]);
        }
    }

    receive() external payable {}

    function withdrawETH() external {
        require(msg.sender == address(this), "Only contract can withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawToken(address tokenAddress, uint256 amount) external {
        require(msg.sender == address(this), "Only contract can withdraw");
        IERC20(tokenAddress).transfer(msg.sender, amount);
        emit WithdrawToken(tokenAddress, amount);
    }
}