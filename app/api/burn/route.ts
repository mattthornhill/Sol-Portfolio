import { NextRequest, NextResponse } from 'next/server';
import { Connection, Transaction, SystemProgram, PublicKey, Keypair } from '@solana/web3.js';
import { createBurnCheckedInstruction, createCloseAccountInstruction, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Burn API request:', { 
      nfts: body.nfts?.length, 
      payerPublicKey: body.payerPublicKey,
      firstNft: body.nfts?.[0]
    });
    
    const { nfts, payerPublicKey } = body;
    
    if (!nfts || !Array.isArray(nfts) || nfts.length === 0) {
      return NextResponse.json({ error: 'No NFTs selected for burning' }, { status: 400 });
    }

    if (!payerPublicKey) {
      return NextResponse.json({ error: 'Payer public key required' }, { status: 400 });
    }

    const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Create transaction
    const transaction = new Transaction();
    const payer = new PublicKey(payerPublicKey);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;
    
    // Process each NFT
    for (const nft of nfts) {
      try {
        console.log('Processing NFT:', { mint: nft.mint, tokenAccount: nft.tokenAccount });
        
        const mint = new PublicKey(nft.mint);
        const tokenAccount = new PublicKey(nft.tokenAccount);
        
        // 1. Burn the NFT token
        const burnInstruction = createBurnCheckedInstruction(
          tokenAccount,
          mint,
          payer,
          1, // amount (1 for NFT)
          0  // decimals (0 for NFT)
        );
        transaction.add(burnInstruction);
        
        // 2. Close the token account to reclaim rent
        const closeInstruction = createCloseAccountInstruction(
          tokenAccount,
          payer, // rent goes back to payer
          payer  // authority
        );
        transaction.add(closeInstruction);
        
      } catch (error) {
        console.error(`Error creating burn instructions for NFT ${nft.mint}:`, error);
        // Continue with other NFTs even if one fails
      }
    }
    
    if (transaction.instructions.length === 0) {
      return NextResponse.json({ error: 'No valid burn instructions created' }, { status: 400 });
    }
    
    // Serialize the transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    // Return the transaction for wallet signing
    return NextResponse.json({
      transaction: Buffer.from(serializedTransaction).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      estimatedRent: nfts.length * 0.002, // Approximate rent recovery per NFT
    });
    
  } catch (error: any) {
    console.error('Burn API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create burn transaction' },
      { status: 500 }
    );
  }
}