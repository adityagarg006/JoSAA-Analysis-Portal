import os
import glob
import re
import pandas as pd
from sqlalchemy import create_engine
import pymysql

def create_db():
    print("Initializing Database Connection...")
    try:
        conn = pymysql.connect(host='localhost', user='root', password='')
        cursor = conn.cursor()
        cursor.execute('CREATE DATABASE IF NOT EXISTS Jossa')
        conn.commit()
        conn.close()
        print("Database 'Jossa' created/verified.")
    except Exception as e:
        print(f"Failed to connect to MySQL or create database: {e}")
        exit(1)

def process_and_upload():
    print("\nReading CSV files from 'DMBS project data' directory...")
    path = "DMBS project data/*.csv"
    files = glob.glob(path)
    
    if not files:
        print("No CSV files found matching 'DMBS project data/*.csv'")
        return

    all_data = []

    for file in files:
        basename = os.path.basename(file)
        match = re.search(r"JoSAA_(\d{4})_(\d+)", basename)
        if match:
            year, round_num = match.groups()
        else:
            print(f"Skipping {basename} - does not match regex.")
            continue
            
        try:
            df = pd.read_csv(file)
            df['year'] = int(year)
            df['round'] = int(round_num)
            df['seats'] = 0 # Default seats to 0 to prevent frontend crashes
            
            rename_map = {
                'Institute': 'iit',
                'Academic Program Name': 'branch',
                'Opening Rank': 'openingRank',
                'Closing Rank': 'closingRank'
            }
            # Lowercase the rest 
            for c in df.columns:
                if c not in rename_map and c not in ['year', 'round', 'seats']:
                    rename_map[c] = c.lower().replace(' ', '_')
            
            df.rename(columns=rename_map, inplace=True)
            all_data.append(df)
        except Exception as e:
            print(f"Error processing {basename}: {e}")

    if not all_data:
        print("No data compiled.")
        return
        
    print("\nConcatenating DataFrames...")
    final_df = pd.concat(all_data, ignore_index=True)
    
    print("Sanitizing Ranks (Removing alphabets like 'P' and nulls)...")
    for col in ['openingRank', 'closingRank']:
        # Keep digits and dots, remove letters
        final_df[col] = final_df[col].astype(str).str.replace(r'[^\d.]', '', regex=True)
        final_df[col] = pd.to_numeric(final_df[col], errors='coerce').fillna(0).astype('int64')

    total_rows = len(final_df)
    print(f"\nFinal Combined Rows: {total_rows}")
    print("Connecting to DB 'Jossa' and pushing payload...")
    
    try:
        engine = create_engine('mysql+pymysql://root:@localhost/Jossa')
        # Writes directly via SQLAlchemy schema generation
        final_df.to_sql('josaa_data', con=engine, if_exists='replace', index=True, index_label='id')
        print(f"Successfully inserted {total_rows} records into Jossa.josaa_data!")
    except Exception as e:
        print(f"Failed to push data to database: {e}")

if __name__ == '__main__':
    create_db()
    process_and_upload()
