pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

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

    event OrderCreated(
        address indexed token,
        uint256 indexed orderId,
        uint256 amount,
        uint256 price,
        address indexed maker,
        bool isBuyOrder
    );
    event OrderExecuted(
        address indexed token,
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 price
    );

    // Added for withdrawing an ERC20 token by the contract owner
    event WithdrawToken(address token, uint256 amount);

    function createOrder(
        address tokenAddress,
        uint256 amount,
        uint256 price,
        bool isBuyOrder
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");
        uint256 orderId = nextOrderId[tokenAddress]++;
        orders[tokenAddress][orderId] = Order(
            tokenAddress,
            amount,
            price,
            msg.sender,
            isBuyOrder
        );
        emit OrderCreated(tokenAddress, orderId, amount, price, msg.sender, isBuyOrder);
    }

    function executeOrder(address tokenAddress, uint256 orderId) external payable {
        Order storage order = orders[tokenAddress][orderId];
        require(order.maker != address(0), "Order does not exist");
        require(
            order.isBuyOrder || msg.value == order.amount * order.price,
            "Incorrect ETH amount"
        );

        if (order.isBuyOrder) {
            require(
                IERC20(tokenAddress).transferFrom(
                    msg.sender,
                    order.maker,
                    order.amount
                ),
                "Token transfer failed"
            );
            payable(msg.sender).transfer(order.amount * order.price);
        } else {
            payable(order.maker).transfer(msg.value);
            require(
                IERC20(tokenAddress).transferFrom(
                    order.maker,
                    msg.sender,
                    order.amount
                ),
                "Token transfer failed"
            );
        }

        emit OrderExecuted(tokenAddress, orderId, msg.sender, order.amount, order.price);

        delete orders[tokenAddress][orderId];
    }

    // Allows the contract to receive ETH
    receive() external payable {}

    // This function is risky as-is because it allows contract self-withdrawal,
    // typically, you would have safeguards or specific roles that can call such functions.
    function withdrawETH() external {
        require(msg.sender == address(this), "Only contract can withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }

    // Function to withdraw ERC20 tokens from the contract.
    // This should be protected and only callable by the owner or specific roles.
    function withdrawToken(address tokenAddress, uint256 amount) external {
        require(msg.sender == address(this), "Only contract can withdraw");
        require(
            IERC20(tokenAddress).transfer(msg.sender, amount),
            "Token transfer failed"
        );
        emit WithdrawToken(tokenAddress, amount);
    }
}