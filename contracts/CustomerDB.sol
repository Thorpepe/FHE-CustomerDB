// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Customer Shopping Database with FHE
/// @notice Stores encrypted shopping information for users with privacy protection
contract CustomerDB is SepoliaConfig {
    struct Purchase {
        euint32 productId;    // Encrypted product ID
        euint64 price;        // Encrypted price
        euint32 quantity;     // Encrypted quantity
        uint256 timestamp;    // Purchase timestamp (not encrypted)
        bool exists;          // Flag to check if purchase exists
    }

    // Mapping from user address to array of purchase IDs
    mapping(address => uint256[]) private userPurchases;

    // Mapping from purchase ID to purchase data
    mapping(uint256 => Purchase) private purchases;

    // Counter for purchase IDs
    uint256 private purchaseCounter;

    // Events
    event PurchaseAdded(address indexed user, uint256 indexed purchaseId, uint256 timestamp);
    event DecryptionRequested(address indexed user, uint256 indexed purchaseId);

    /// @notice Add a new purchase record
    /// @param encryptedProductId Encrypted product ID
    /// @param encryptedPrice Encrypted price
    /// @param encryptedQuantity Encrypted quantity
    /// @param inputProof Input proof for encryption validation
    function addPurchase(
        externalEuint32 encryptedProductId,
        externalEuint64 encryptedPrice,
        externalEuint32 encryptedQuantity,
        bytes calldata inputProof
    ) external {
        // Validate and convert external encrypted inputs
        euint32 productId = FHE.fromExternal(encryptedProductId, inputProof);
        euint64 price = FHE.fromExternal(encryptedPrice, inputProof);
        euint32 quantity = FHE.fromExternal(encryptedQuantity, inputProof);

        // Create new purchase
        uint256 purchaseId = purchaseCounter++;
        purchases[purchaseId] = Purchase({
            productId: productId,
            price: price,
            quantity: quantity,
            timestamp: block.timestamp,
            exists: true
        });

        // Add to user's purchase list
        userPurchases[msg.sender].push(purchaseId);

        // Grant ACL permissions
        FHE.allowThis(productId);
        FHE.allow(productId, msg.sender);

        FHE.allowThis(price);
        FHE.allow(price, msg.sender);

        FHE.allowThis(quantity);
        FHE.allow(quantity, msg.sender);

        emit PurchaseAdded(msg.sender, purchaseId, block.timestamp);
    }

    /// @notice Get the number of purchases for a user
    /// @param user User address
    /// @return Number of purchases
    function getPurchaseCount(address user) external view returns (uint256) {
        return userPurchases[user].length;
    }

    /// @notice Get purchase IDs for a user
    /// @param user User address
    /// @return Array of purchase IDs
    function getUserPurchaseIds(address user) external view returns (uint256[] memory) {
        return userPurchases[user];
    }

    /// @notice Get encrypted purchase data by ID
    /// @param purchaseId Purchase ID
    /// @return productId Encrypted product ID
    /// @return price Encrypted price
    /// @return quantity Encrypted quantity
    /// @return timestamp Purchase timestamp
    function getPurchase(uint256 purchaseId)
        external
        view
        returns (euint32 productId, euint64 price, euint32 quantity, uint256 timestamp)
    {
        require(purchases[purchaseId].exists, "Purchase does not exist");

        Purchase memory purchase = purchases[purchaseId];
        return (purchase.productId, purchase.price, purchase.quantity, purchase.timestamp);
    }

    /// @notice Get encrypted purchase data for a specific user purchase index
    /// @param user User address
    /// @param index Index in user's purchase array
    /// @return productId Encrypted product ID
    /// @return price Encrypted price
    /// @return quantity Encrypted quantity
    /// @return timestamp Purchase timestamp
    function getUserPurchase(address user, uint256 index)
        external
        view
        returns (euint32 productId, euint64 price, euint32 quantity, uint256 timestamp)
    {
        require(index < userPurchases[user].length, "Invalid purchase index");

        uint256 purchaseId = userPurchases[user][index];
        Purchase memory purchase = purchases[purchaseId];

        return (purchase.productId, purchase.price, purchase.quantity, purchase.timestamp);
    }

    /// @notice Get purchase data for the caller's purchases
    /// @param index Index in caller's purchase array
    /// @return productId Encrypted product ID
    /// @return price Encrypted price
    /// @return quantity Encrypted quantity
    /// @return timestamp Purchase timestamp
    function getMyPurchase(uint256 index)
        external
        view
        returns (euint32 productId, euint64 price, euint32 quantity, uint256 timestamp)
    {
        require(index < userPurchases[msg.sender].length, "Invalid purchase index");

        uint256 purchaseId = userPurchases[msg.sender][index];
        Purchase memory purchase = purchases[purchaseId];

        return (purchase.productId, purchase.price, purchase.quantity, purchase.timestamp);
    }

    /// @notice Get total number of purchases in the system
    /// @return Total purchase count
    function getTotalPurchases() external view returns (uint256) {
        return purchaseCounter;
    }

    /// @notice Check if a purchase exists
    /// @param purchaseId Purchase ID to check
    /// @return True if purchase exists
    function purchaseExists(uint256 purchaseId) external view returns (bool) {
        return purchases[purchaseId].exists;
    }
}