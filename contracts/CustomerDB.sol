// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Customer Purchases Database
/// @notice Stores encrypted purchase records per customer using Zama FHEVM
/// @dev Encrypted fields are stored as euint32 to keep inputs compact and simple.
contract CustomerDB is SepoliaConfig {
    struct Purchase {
        euint32 itemId;
        euint32 price;
        euint32 quantity;
        uint64 timestamp;
    }

    mapping(address => Purchase[]) private _purchases;

    /// @notice Append a new encrypted purchase for a customer.
    /// @param customer The address owning the purchase list (must be provided explicitly)
    /// @param itemIdExt Encrypted item id (external handle)
    /// @param priceExt Encrypted price (external handle)
    /// @param quantityExt Encrypted quantity (external handle)
    /// @param inputProof The input proof corresponding to all provided handles
    function addPurchase(
        address customer,
        externalEuint32 itemIdExt,
        externalEuint32 priceExt,
        externalEuint32 quantityExt,
        bytes calldata inputProof
    ) external {
        euint32 itemId = FHE.fromExternal(itemIdExt, inputProof);
        euint32 price = FHE.fromExternal(priceExt, inputProof);
        euint32 quantity = FHE.fromExternal(quantityExt, inputProof);

        // Persist purchase
        _purchases[customer].push(
            Purchase({
                itemId: itemId,
                price: price,
                quantity: quantity,
                timestamp: uint64(block.timestamp)
            })
        );

        // Allow this contract and the customer to reencrypt/decrypt
        FHE.allowThis(itemId);
        FHE.allowThis(price);
        FHE.allowThis(quantity);
        FHE.allow(itemId, customer);
        FHE.allow(price, customer);
        FHE.allow(quantity, customer);
    }

    /// @notice Get number of purchases for a given customer
    function getPurchaseCount(address customer) external view returns (uint256) {
        return _purchases[customer].length;
    }

    /// @notice Get a purchase by index for a given customer
    /// @dev View functions never use msg.sender for addressing; caller provides address explicitly.
    function getPurchaseAt(
        address customer,
        uint256 index
    ) external view returns (euint32 itemId, euint32 price, euint32 quantity, uint64 timestamp) {
        Purchase storage p = _purchases[customer][index];
        return (p.itemId, p.price, p.quantity, p.timestamp);
    }
}

